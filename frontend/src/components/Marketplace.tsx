import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction, usePublicClient, useWalletClient, useSwitchNetwork, useNetwork, useAccount } from 'wagmi';
import { CONTRACT_CONFIG } from '../utils/contractConfig';
import { MARKETPLACE_CONFIG } from '../utils/marketplaceConfig';
import { retrieveFileContent } from '../utils/ipfsVerification';
import { parseEther, formatEther } from 'viem';

type ListingView = {
  datasetId: number;
  owner: string;
  cid: string;
  dataHash: string;
  modelVersion: string;
  priceWei?: bigint;
  licenseCid?: string;
  active?: boolean;
  purchaseCount?: number;
};

const Marketplace: React.FC = () => {
  // Removed unused account destructuring to satisfy TS and keep UI clean
  const publicClient = usePublicClient();
  const [topicFilter, setTopicFilter] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'price' | 'popularity'>('recent');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'valid' | 'invalid' | 'error'>('idle');
  const [listings, setListings] = useState<ListingView[]>([]);
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const { switchNetworkAsync } = useSwitchNetwork();
  const { chain } = useNetwork();
  const OG_CHAIN_ID = 16602;
  const ensureOgChain = async () => {
    try {
      if (chain?.id !== OG_CHAIN_ID && switchNetworkAsync) {
        await switchNetworkAsync(OG_CHAIN_ID);
      }
    } catch (_) {}
  };

  // Read total datasets
  const { data: totalDatasets } = useContractRead({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getTotalDatasets',
  });

  // Load datasets and associated listings
  useEffect(() => {
    async function fetchAll() {
      const total = Number(totalDatasets || 0);
      const arr: ListingView[] = [];
      for (let id = 1; id <= total; id++) {
        try {
          const dataset: any = await publicClient?.readContract({
            address: CONTRACT_CONFIG.address,
            abi: CONTRACT_CONFIG.abi,
            functionName: 'getDataset',
            args: [BigInt(id)],
          });
          const listing: any = await publicClient?.readContract({
            address: MARKETPLACE_CONFIG.address,
            abi: MARKETPLACE_CONFIG.abi,
            functionName: 'getListing',
            args: [BigInt(id)],
          }).catch(() => undefined);

          if (dataset) {
            arr.push({
              datasetId: Number(dataset.id),
              owner: dataset.owner,
              cid: dataset.cid,
              dataHash: dataset.dataHash,
              modelVersion: dataset.modelVersion,
              priceWei: listing?.price,
              licenseCid: listing?.licenseCid,
              active: listing?.active,
              purchaseCount: listing?.purchaseCount ? Number(listing.purchaseCount) : 0,
            });
          }
        } catch (e) {
          // ignore
        }
      }
      setListings(arr);
    }
    fetchAll();
  }, [totalDatasets, publicClient]);

  const filtered = useMemo(() => {
    let list = listings.filter((l) => !topicFilter || l.modelVersion?.toLowerCase().includes(topicFilter.toLowerCase()));
    switch (sortBy) {
      case 'price':
        list = list.sort((a, b) => Number((a.priceWei || 0n) - (b.priceWei || 0n)));
        break;
      case 'popularity':
        list = list.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
        break;
      default:
        list = list.sort((a, b) => b.datasetId - a.datasetId);
    }
    return list;
  }, [listings, topicFilter, sortBy]);

  // Creator Tools: create listing
  const [createId, setCreateId] = useState<number | ''>('');
  const [createPriceEth, setCreatePriceEth] = useState<string>('');
  const [createLicenseCid, setCreateLicenseCid] = useState<string>('');
  const createPriceWei = createPriceEth ? safeParseEther(createPriceEth) : null;
  const createArgs = createId && createPriceWei !== null && createLicenseCid ? [BigInt(createId), createPriceWei!, createLicenseCid] as const : undefined;
  const { config: createConfig } = usePrepareContractWrite({
    address: MARKETPLACE_CONFIG.address,
    abi: MARKETPLACE_CONFIG.abi,
    functionName: 'createListing',
    args: createArgs,
    enabled: Boolean(createArgs),
  });
  const { data: createData } = useContractWrite(createConfig);
  const { isSuccess: createOk } = useWaitForTransaction({ hash: createData?.hash });
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  useEffect(() => {
    if (createOk) {
      setCreateId(''); setCreatePriceEth(''); setCreateLicenseCid('');
    }
  }, [createOk]);

  const handleCreateListing = async () => {
    setCreateError(null);
    if (!walletClient || !createArgs) { setCreateError('Connect wallet and fill all fields.'); return; }
    setCreateBusy(true);
    try {
      await ensureOgChain();
      const txHash = await walletClient.writeContract({
        address: MARKETPLACE_CONFIG.address,
        abi: MARKETPLACE_CONFIG.abi,
        functionName: 'createListing',
        account: address!,
        args: createArgs,
      });
      await publicClient?.waitForTransactionReceipt({ hash: txHash });
      setCreateId(''); setCreatePriceEth(''); setCreateLicenseCid('');
      // refresh listing for created id
      const id = Number(createArgs[0]);
      try {
        const listing: any = await publicClient?.readContract({
          address: MARKETPLACE_CONFIG.address,
          abi: MARKETPLACE_CONFIG.abi,
          functionName: 'getListing',
          args: [BigInt(id)],
        });
        setListings((prev) => prev.map((l) => l.datasetId === id ? { ...l, priceWei: listing?.price, licenseCid: listing?.licenseCid, active: listing?.active } : l));
      } catch (_) {}
    } catch (err: any) {
      setCreateError(err?.shortMessage || err?.message || 'Failed to create listing');
    } finally {
      setCreateBusy(false);
    }
  };

  // Update listing
  const [updateId, setUpdateId] = useState<number | ''>('');
  const [updatePriceEth, setUpdatePriceEth] = useState<string>('');
  const [updateLicenseCid, setUpdateLicenseCid] = useState<string>('');
  const [updateActive, setUpdateActive] = useState<boolean>(true);
  const updatePriceWei = updatePriceEth ? safeParseEther(updatePriceEth) : null;
  const updateArgs = updateId && updatePriceWei !== null && updateLicenseCid ? [BigInt(updateId), updatePriceWei!, updateLicenseCid, updateActive] as const : undefined;
  const { config: updateConfig } = usePrepareContractWrite({
    address: MARKETPLACE_CONFIG.address,
    abi: MARKETPLACE_CONFIG.abi,
    functionName: 'updateListing',
    args: updateArgs,
    enabled: Boolean(updateArgs),
  });
  const { data: updateData } = useContractWrite(updateConfig);
  const { isSuccess: updateOk } = useWaitForTransaction({ hash: updateData?.hash });
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  useEffect(() => {
    if (updateOk) {
      setUpdateId('');
      setUpdatePriceEth('');
      setUpdateLicenseCid('');
      setUpdateActive(true);
    }
  }, [updateOk]);

  const handleUpdateListing = async () => {
    setUpdateError(null);
    if (!walletClient || !updateArgs) { setUpdateError('Connect wallet and fill all fields.'); return; }
    setUpdateBusy(true);
    try {
      await ensureOgChain();
      const txHash = await walletClient.writeContract({
        address: MARKETPLACE_CONFIG.address,
        abi: MARKETPLACE_CONFIG.abi,
        functionName: 'updateListing',
        account: address!,
        args: updateArgs,
      });
      await publicClient?.waitForTransactionReceipt({ hash: txHash });
      const id = Number(updateArgs[0]);
      try {
        const listing: any = await publicClient?.readContract({
          address: MARKETPLACE_CONFIG.address,
          abi: MARKETPLACE_CONFIG.abi,
          functionName: 'getListing',
          args: [BigInt(id)],
        });
        setListings((prev) => prev.map((l) => l.datasetId === id ? { ...l, priceWei: listing?.price, licenseCid: listing?.licenseCid, active: listing?.active } : l));
      } catch (_) {}
      setUpdateId(''); setUpdatePriceEth(''); setUpdateLicenseCid(''); setUpdateActive(true);
    } catch (err: any) {
      setUpdateError(err?.shortMessage || err?.message || 'Failed to update listing');
    } finally {
      setUpdateBusy(false);
    }
  };

  // Buyer: purchase listing
  const selectedListing = listings.find((l) => l.datasetId === selectedId);
  const { config: buyConfig } = usePrepareContractWrite({
    address: MARKETPLACE_CONFIG.address,
    abi: MARKETPLACE_CONFIG.abi,
    functionName: 'buy',
    args: selectedId ? [BigInt(selectedId)] : undefined,
    value: selectedListing?.priceWei,
    enabled: Boolean(selectedId && selectedListing?.priceWei),
  });
  const { data: buyData } = useContractWrite(buyConfig);
  const { isSuccess: buyOk } = useWaitForTransaction({ hash: buyData?.hash });
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    if (buyOk) {
      // Refresh listing purchase counts
      setListings((prev) => prev.map((l) => l.datasetId === selectedId ? { ...l, purchaseCount: (l.purchaseCount || 0) + 1 } : l));
    }
  }, [buyOk]);

  const handlePreview = async (id: number) => {
    const l = listings.find((x) => x.datasetId === id);
    setSelectedId(id);
    setVerifyStatus('idle');
    if (!l?.cid) return;
    try {
      const content = await retrieveFileContent(l.cid); // string content
      // Try parsing as JSON; otherwise treat as text lines
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setPreview(parsed.slice(0, 5));
        } else if (parsed && Array.isArray((parsed as any).data)) {
          setPreview(((parsed as any).data as any[]).slice(0, 5));
        } else {
          const lines = content.split(/\r?\n/).filter(Boolean).slice(0, 5);
          setPreview(lines.length ? lines : null);
        }
      } catch {
        const lines = content.split(/\r?\n/).filter(Boolean).slice(0, 5);
        setPreview(lines.length ? lines : null);
      }
    } catch {
      setPreview(null);
    }
  };

  const handleVerify = async () => {
    const l = selectedListing;
    if (!l) return;
    try {
      if (!l.cid) {
        setVerifyStatus('error');
        return;
      }
      const content = await retrieveFileContent(l.cid);
      // Attempt to parse IPFS JSON structure and recompute deterministic hash
      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        setVerifyStatus('error');
        return;
      }
      // Prefer computeDataHash if structure includes metadata + data
      let recomputed = '';
      try {
        const { computeDataHash } = await import('../utils/dataGenerator');
        recomputed = await computeDataHash(parsed);
      } catch {
        // Fallback: basic SHA-256 over content
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const digest = await crypto.subtle.digest('SHA-256', data);
        const bytes = new Uint8Array(digest);
        recomputed = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      }

      setVerifyStatus(recomputed && l.dataHash && recomputed === l.dataHash ? 'valid' : 'invalid');
    } catch {
      setVerifyStatus('error');
    }
  };

  const handleBuyNow = async (id: number) => {
    const l = listings.find((x) => x.datasetId === id);
    setBuyError(null);
    if (!walletClient || !l?.priceWei) { setBuyError('Connect wallet and select a priced listing.'); return; }
    try {
      setBuyBusy(true);
      await ensureOgChain();
      const txHash = await walletClient.writeContract({
        address: MARKETPLACE_CONFIG.address,
        abi: MARKETPLACE_CONFIG.abi,
        functionName: 'buy',
        account: address!,
        args: [BigInt(id)],
        value: l.priceWei,
      });
      await publicClient?.waitForTransactionReceipt({ hash: txHash });
      setListings((prev) => prev.map((x) => x.datasetId === id ? { ...x, purchaseCount: (x.purchaseCount || 0) + 1 } : x));
    } catch (err) {
      console.error('Buy failed:', err);
      setBuyError((err as any)?.shortMessage || (err as any)?.message || 'Purchase failed');
    } finally {
      setBuyBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-emerald-100 to-cyan-100 p-3 rounded-xl">
            <Icon icon="ph:storefront" className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
            <p className="text-gray-500">Discover, trade, and curate synthetic datasets</p>
          </div>
        </div>

        {/* Buying & Listing Guide */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center mr-3">1</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Filter & Select</p>
              <p className="text-xs text-gray-600">Find a dataset by topic or popularity.</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center mr-3">2</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Preview & Verify</p>
              <p className="text-xs text-gray-600">Inspect sample records and hash validity.</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center mr-3">3</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Purchase</p>
              <p className="text-xs text-gray-600">Complete the transaction securely.</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center mr-3">4</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Manage Listings</p>
              <p className="text-xs text-gray-600">Set price, license, and activity.</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Curation & Listings</h3>
            <p className="text-sm text-gray-600 mb-3">Browse curated datasets by topic and popularity.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Filter by topic/model</label>
                <input className="input-field" placeholder="e.g., GPT-4, v1.0, sentiment" value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
                <select className="input-field" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                  <option value="recent">Recent</option>
                  <option value="price">Price</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Creator Tools</h3>
            <p className="text-sm text-gray-600 mb-3">Set pricing and license terms for your dataset.</p>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Dataset ID</label>
              <input className="input-field" placeholder="e.g., 12" value={createId} onChange={(e) => setCreateId(e.target.value ? parseInt(e.target.value) : '')} />
              <label className="block text-xs font-medium text-gray-700 mt-2">Price (ETH)</label>
              <input className="input-field" placeholder="e.g., 0.05" value={createPriceEth} onChange={(e) => setCreatePriceEth(e.target.value)} />
              <label className="block text-xs font-medium text-gray-700 mt-2">License CID (IPFS)</label>
              <input className="input-field" placeholder="e.g., Qm..." value={createLicenseCid} onChange={(e) => setCreateLicenseCid(e.target.value)} />
              <div className="flex justify-end">
                <button className="btn-primary" onClick={handleCreateListing} disabled={createBusy}><Icon icon="ph:tag" className="w-5 h-5 mr-2" />{createBusy ? 'Creating...' : 'Create Listing'}</button>
              </div>
              {createError && <p className="text-xs text-red-600 mt-1">{createError}</p>}
            </div>
            <div className="mt-4 space-y-2 border-t pt-3">
              <label className="block text-xs font-medium text-gray-700">Update ID</label>
              <input className="input-field" placeholder="e.g., 12" value={updateId} onChange={(e) => setUpdateId(e.target.value ? parseInt(e.target.value) : '')} />
              <label className="block text-xs font-medium text-gray-700 mt-2">New Price (ETH)</label>
              <input className="input-field" placeholder="e.g., 0.10" value={updatePriceEth} onChange={(e) => setUpdatePriceEth(e.target.value)} />
              <label className="block text-xs font-medium text-gray-700 mt-2">New License CID</label>
              <input className="input-field" placeholder="e.g., Qm..." value={updateLicenseCid} onChange={(e) => setUpdateLicenseCid(e.target.value)} />
              <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={updateActive} onChange={(e) => setUpdateActive(e.target.checked)} /><span>Active</span></label>
              <div className="flex justify-end">
                <button className="btn-secondary" onClick={handleUpdateListing} disabled={updateBusy}><Icon icon="ph:gear" className="w-5 h-5 mr-2" />{updateBusy ? 'Updating...' : 'Update Listing'}</button>
              </div>
              {updateError && <p className="text-xs text-red-600 mt-1">{updateError}</p>}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Buyer Experience</h3>
            <p className="text-sm text-gray-600 mb-3">Preview, verify, and purchase securely.</p>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Selected Dataset ID</label>
              <input className="input-field" placeholder="e.g., 12" value={selectedId || ''} onChange={(e) => setSelectedId(e.target.value ? parseInt(e.target.value) : null)} />
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Step 2: Preview & Verify</span>
                <span>Step 3: Purchase</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex space-x-2">
                  <button className="btn-secondary" onClick={() => selectedId && handlePreview(selectedId)} disabled={!selectedId}><Icon icon="ph:eye" className="w-5 h-5 mr-2" />Preview</button>
                  <button className="btn-secondary" onClick={handleVerify} disabled={!selectedId}><Icon icon="ph:shield-check" className="w-5 h-5 mr-2" />Verify</button>
                </div>
                <button className="btn-primary" onClick={() => selectedId && handleBuyNow(selectedId)} disabled={buyBusy || !selectedId}><Icon icon="ph:shopping-cart" className="w-5 h-5 mr-2" />{buyBusy ? 'Purchasing...' : 'Purchase'}</button>
              </div>
              {buyError && <p className="text-xs text-red-600 mt-1">{buyError}</p>}
              {verifyStatus !== 'idle' && (
                <p className={`text-xs ${verifyStatus === 'valid' ? 'text-green-600' : verifyStatus === 'invalid' ? 'text-red-600' : 'text-gray-600'}`}>Verification: {verifyStatus}</p>
              )}
              {preview && (
                <div className="mt-2 bg-white border rounded p-2 text-xs max-h-40 overflow-auto">
                  <pre>{JSON.stringify(preview, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Curated Listings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-3 rounded-xl">
            <Icon icon="ph:squares-four" className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Curated Listings</h3>
            <p className="text-sm text-gray-600">Browse datasets with pricing and popularity</p>
          </div>
        </div>
        <ul className="divide-y divide-gray-200">
          {filtered.map((l) => (
            <li key={l.datasetId} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 font-medium">Dataset #{l.datasetId} • {l.modelVersion}</p>
                  <p className="text-xs text-gray-600">Owner: {l.owner?.slice(0,6)}...{l.owner?.slice(-4)} • CID: <span className="font-mono">{l.cid?.slice(0,9)}...</span></p>
                  {l.licenseCid && (
                    <a className="text-xs text-indigo-600 underline" href={`https://gateway.pinata.cloud/ipfs/${l.licenseCid}`} target="_blank" rel="noreferrer">License Terms</a>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{l.priceWei ? `${formatEther(l.priceWei)} ETH` : '—'}</p>
                  <p className="text-xs text-gray-600">Purchases: {l.purchaseCount || 0}</p>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-2">
                <button className="btn-secondary text-xs" onClick={() => handlePreview(l.datasetId)}><Icon icon="ph:eye" className="w-4 h-4 mr-1" /> Preview</button>
                <button className="btn-secondary text-xs" onClick={() => { setSelectedId(l.datasetId); handleVerify(); }}><Icon icon="ph:shield-check" className="w-4 h-4 mr-1" /> Verify</button>
                <button className="btn-primary text-xs" onClick={() => handleBuyNow(l.datasetId)} disabled={!walletClient || !l.priceWei}><Icon icon="ph:shopping-cart" className="w-4 h-4 mr-1" /> Purchase</button>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default Marketplace;
function safeParseEther(v: string): bigint | null {
  try { return parseEther(v as `${number}`); } catch { return null; }
}