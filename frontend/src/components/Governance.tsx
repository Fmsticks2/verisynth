import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useContractRead, usePublicClient, useWalletClient, useSwitchNetwork, useNetwork, useAccount } from 'wagmi';
import { GOVERNANCE_CONFIG } from '../utils/governanceConfig';

const Governance: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const publicClient = usePublicClient();
  const voteSectionRef = useRef<HTMLDivElement | null>(null);
  const { data: walletClient } = useWalletClient();
  const { switchNetworkAsync } = useSwitchNetwork();
  const { chain } = useNetwork();
  const { address } = useAccount();
  const OG_CHAIN_ID = 16602;
  const ensureOgChain = async () => {
    try {
      if (chain?.id !== OG_CHAIN_ID && switchNetworkAsync) {
        await switchNetworkAsync(OG_CHAIN_ID);
      }
    } catch (_) {}
  };

  // Deep link: read ?proposalId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('proposalId');
    if (pid) setSelectedProposalId(parseInt(pid));
    // Smooth scroll to voting section if deep-linked
    setTimeout(() => {
      voteSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, []);

  // Read total proposals count
  const { data: proposalCountData } = useContractRead({
    address: GOVERNANCE_CONFIG.address,
    abi: GOVERNANCE_CONFIG.abi,
    functionName: 'getProposalCount',
  });

  // Read proposals list
  const [proposals, setProposals] = useState<any[]>([]);
  useEffect(() => {
    async function loadProposals() {
      const count = Number(proposalCountData || 0);
      const arr: any[] = [];
      for (let i = 1; i <= count; i++) {
        try {
          const resp = await publicClient?.readContract({
            address: GOVERNANCE_CONFIG.address,
            abi: GOVERNANCE_CONFIG.abi,
            functionName: 'getProposal',
            args: [BigInt(i)],
          });
          if (resp) {
            const r: any = resp as any;
            const parsed = Array.isArray(r) ? {
              id: Number(r[0]),
              title: r[1],
              description: r[2],
              url: r[3],
              proposer: r[4],
              createdAt: Number(r[5] || 0),
              forVotes: Number(r[6] || 0),
              againstVotes: Number(r[7] || 0),
              closed: Boolean(r[8] || false),
            } : {
              id: Number(r.id || 0),
              title: r.title,
              description: r.description,
              url: r.url,
              proposer: r.proposer,
              createdAt: Number(r.createdAt || 0),
              forVotes: Number(r.forVotes || 0),
              againstVotes: Number(r.againstVotes || 0),
              closed: Boolean(r.closed || false),
            };
            arr.push(parsed);
          }
        } catch (e) {
          // Ignore read errors for demo
        }
      }
      setProposals(arr);
    }
    loadProposals();
  }, [proposalCountData, publicClient]);

  // Create proposal via wallet
  const canCreate = title.trim().length > 0;
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleSubmitProposal = async () => {
    setCreateError(null);
    if (!walletClient || !canCreate) { setCreateError('Connect wallet and fill in the title.'); return; }
    setCreateBusy(true);
    try {
      await ensureOgChain();
      const txHash = await walletClient.writeContract({
        address: GOVERNANCE_CONFIG.address,
        abi: GOVERNANCE_CONFIG.abi,
        functionName: 'createProposal',
        args: [title, description, url],
      });
      await publicClient?.waitForTransactionReceipt({ hash: txHash });
      setTitle(''); setDescription(''); setUrl('');
      // refresh proposals
      const count = Number(await publicClient?.readContract({
        address: GOVERNANCE_CONFIG.address,
        abi: GOVERNANCE_CONFIG.abi,
        functionName: 'getProposalCount',
        args: [],
      }) || 0);
      const arr: any[] = [];
      for (let i = 1; i <= count; i++) {
        try {
          const resp = await publicClient?.readContract({
            address: GOVERNANCE_CONFIG.address,
            abi: GOVERNANCE_CONFIG.abi,
            functionName: 'getProposal',
            args: [BigInt(i)],
          });
          if (resp) {
            const r: any = resp as any;
            const parsed = Array.isArray(r) ? {
              id: Number(r[0]),
              title: r[1],
              description: r[2],
              url: r[3],
              proposer: r[4],
              createdAt: Number(r[5] || 0),
              forVotes: Number(r[6] || 0),
              againstVotes: Number(r[7] || 0),
              closed: Boolean(r[8] || false),
            } : {
              id: Number(r.id || 0),
              title: r.title,
              description: r.description,
              url: r.url,
              proposer: r.proposer,
              createdAt: Number(r.createdAt || 0),
              forVotes: Number(r.forVotes || 0),
              againstVotes: Number(r.againstVotes || 0),
              closed: Boolean(r.closed || false),
            };
            arr.push(parsed);
          }
        } catch {}
      }
      setProposals(arr);
    } catch (err: any) {
      setCreateError(err?.shortMessage || err?.message || 'Failed to submit proposal');
    } finally {
      setCreateBusy(false);
    }
  };

  // Voting
  const [voteTargetId, setVoteTargetId] = useState<number | null>(null);
  const [voteSupport, setVoteSupport] = useState<boolean>(true);
  const [voteBusy, setVoteBusy] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState<boolean>(false);

  // Check if current wallet has already voted on the selected proposal
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const pid = voteTargetId ?? selectedProposalId;
        if (!address || !publicClient || !pid) {
          if (!cancelled) setAlreadyVoted(false);
          return;
        }
        const v = await publicClient.readContract({
          address: GOVERNANCE_CONFIG.address,
          abi: GOVERNANCE_CONFIG.abi,
          functionName: 'hasVoted',
          args: [BigInt(pid), address],
        });
        if (!cancelled) setAlreadyVoted(Boolean(v));
      } catch {
        if (!cancelled) setAlreadyVoted(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [address, voteTargetId, selectedProposalId, publicClient]);

  const handleCastVote = async () => {
    setVoteError(null);
    const target = voteTargetId ?? selectedProposalId;
    if (!walletClient || !target) { setVoteError('Connect wallet and select a proposal.'); return; }
    // Validate proposal existence and status
    const targetProposal = proposals.find((p) => Number(p.id) === Number(target));
    if (!targetProposal) { setVoteError('Invalid proposal ID.'); return; }
    if (targetProposal.closed) { setVoteError('This proposal is closed. Voting disabled.'); return; }
    setVoteBusy(true);
    try {
      await ensureOgChain();
      // UI guard: only one vote per wallet
      const voted = await publicClient?.readContract({
        address: GOVERNANCE_CONFIG.address,
        abi: GOVERNANCE_CONFIG.abi,
        functionName: 'hasVoted',
        args: [BigInt(target), address!],
      });
      if (voted) {
        setVoteError('You have already voted on this proposal. One vote per wallet.');
        return;
      }
      const txHash = await walletClient.writeContract({
        address: GOVERNANCE_CONFIG.address,
        abi: GOVERNANCE_CONFIG.abi,
        functionName: 'vote',
        args: [BigInt(target), voteSupport],
      });
      await publicClient?.waitForTransactionReceipt({ hash: txHash });
      setVoteTargetId(null);
      // refresh proposals
      const count = Number(await publicClient?.readContract({
        address: GOVERNANCE_CONFIG.address,
        abi: GOVERNANCE_CONFIG.abi,
        functionName: 'getProposalCount',
        args: [],
      }) || 0);
      const arr: any[] = [];
      for (let i = 1; i <= count; i++) {
        try {
          const resp = await publicClient?.readContract({
            address: GOVERNANCE_CONFIG.address,
            abi: GOVERNANCE_CONFIG.abi,
            functionName: 'getProposal',
            args: [BigInt(i)],
          });
          if (resp) {
            const r: any = resp as any;
            const parsed = Array.isArray(r) ? {
              id: Number(r[0]),
              title: r[1],
              description: r[2],
              url: r[3],
              proposer: r[4],
              createdAt: Number(r[5] || 0),
              forVotes: Number(r[6] || 0),
              againstVotes: Number(r[7] || 0),
              closed: Boolean(r[8] || false),
            } : {
              id: Number(r.id || 0),
              title: r.title,
              description: r.description,
              url: r.url,
              proposer: r.proposer,
              createdAt: Number(r.createdAt || 0),
              forVotes: Number(r.forVotes || 0),
              againstVotes: Number(r.againstVotes || 0),
              closed: Boolean(r.closed || false),
            };
            arr.push(parsed);
          }
        } catch {}
      }
      setProposals(arr);
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || '';
      if (msg && /Missing or invalid parameters/i.test(msg)) {
        setVoteError('Missing or invalid parameters. Verify proposal ID and vote eligibility.');
      } else if (msg) {
        setVoteError(msg);
      } else {
        setVoteError('Failed to cast vote');
      }
    } finally {
      setVoteBusy(false);
    }
  };

  const handleShareLink = (id: number) => {
    const base = window.location.origin + window.location.pathname;
    const link = `${base}?proposalId=${id}`;
    navigator.clipboard.writeText(link).catch(() => {});
    alert('Proposal link copied to clipboard');
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-teal-100 to-green-100 p-3 rounded-xl">
            <Icon icon="ph:hand-waving" className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Decentralized Governance</h2>
            <p className="text-gray-500">Create proposals, share links, and vote on-chain</p>
          </div>
        </div>

        {/* Governance Guide */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center mr-3">1</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Draft Details</p>
              <p className="text-xs text-gray-600">Title, description, optional URL.</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center mr-3">2</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Review</p>
              <p className="text-xs text-gray-600">Ensure clarity and relevance.</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center mr-3">3</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Submit</p>
              <p className="text-xs text-gray-600">Publish on-chain for voting.</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center mr-3">4</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Vote & Share</p>
              <p className="text-xs text-gray-600">Cast votes and share links.</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Create Proposal</h3>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Title</label>
              <input
                className="input-field"
                placeholder="Clear, action-oriented title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <label className="block text-xs font-medium text-gray-700 mt-2">Description</label>
              <textarea
                className="textarea-field"
                placeholder="Explain rationale, impact, and implementation details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <label className="block text-xs font-medium text-gray-700 mt-2">Optional URL</label>
              <input
                className="input-field"
                placeholder="Context link or call-to-action"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <div className="flex justify-end">
                <button className="btn-primary" onClick={handleSubmitProposal} disabled={createBusy || !canCreate}>
                  <Icon icon="ph:plus-circle" className="w-5 h-5 mr-2" />
                  {createBusy ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </div>
              {createError && <p className="text-xs text-red-600 mt-1">{createError}</p>}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl" ref={voteSectionRef}>
            <h3 className="font-semibold text-gray-900 mb-2">Voting</h3>
            <p className="text-sm text-gray-600">Pick a proposal and cast your vote.</p>
            <p className="text-xs text-gray-500 mt-1">You can only vote once per proposal.</p>
            <div className="flex items-center space-x-2 mt-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700">Proposal ID</label>
                <input
                  className="input-field"
                  placeholder="e.g., 3"
                  value={voteTargetId || selectedProposalId || ''}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    setVoteTargetId(Number.isFinite(v) ? v : null);
                  }}
                />
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-gray-700">Support</label>
                <select className="input-field" value={voteSupport ? 'for' : 'against'} onChange={(e) => setVoteSupport(e.target.value === 'for')}>
                  <option value="for">For</option>
                  <option value="against">Against</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button className="btn-primary" onClick={handleCastVote} disabled={voteBusy || alreadyVoted}>
                <Icon icon="ph:checks" className="w-5 h-5 mr-2" />
                {voteBusy ? 'Voting...' : 'Vote'}
              </button>
            </div>
            {alreadyVoted && <p className="text-xs text-orange-600 mt-1">You have already voted on this proposal.</p>}
            {voteError && <p className="text-xs text-red-600 mt-1">{voteError}</p>}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-3 rounded-xl">
            <Icon icon="ph:megaphone" className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Active Proposals</h3>
            <p className="text-sm text-gray-600">Community-driven improvements</p>
          </div>
        </div>
        <ul className="divide-y divide-gray-200">
          {proposals.map((p: any) => (
            <li key={Number(p.id || 0)} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 font-medium">Proposal #{Number(p.id)} • {p.title}</p>
                  <p className="text-xs text-gray-600">
                    ID: #{Number(p.id)} • For: <span className="font-medium text-gray-900">{Number(p.forVotes)}</span> • Against: <span className="font-medium text-gray-900">{Number(p.againstVotes)}</span>
                  </p>
                  <p className="text-xs text-gray-600 break-words">{p.description}</p>
                  {p.url && (
                    <a className="text-xs text-indigo-600 underline" href={p.url} target="_blank" rel="noreferrer">External link</a>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Proposer: {p.proposer?.slice(0,6)}...{p.proposer?.slice(-4)} • Created: {p.createdAt ? new Date(p.createdAt * 1000).toLocaleString() : '—'}</p>
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {p.closed ? 'Closed' : 'Open'}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-gray-600">Copy the link to share and direct voters.</div>
                <div className="flex items-center space-x-2">
                  <button className="btn-secondary text-xs" onClick={() => { setVoteTargetId(Number(p.id)); voteSectionRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>
                    <Icon icon="ph:checks" className="w-4 h-4 mr-1" /> Vote
                  </button>
                  <button className="btn-secondary text-xs" onClick={() => handleShareLink(Number(p.id))}>
                    <Icon icon="ph:link-simple" className="w-4 h-4 mr-1" /> Copy Link
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default Governance;