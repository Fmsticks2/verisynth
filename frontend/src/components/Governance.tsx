import * as React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi';
import { GOVERNANCE_CONFIG } from '../utils/governanceConfig';

const Governance: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);

  // Deep link: read ?proposalId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('proposalId');
    if (pid) setSelectedProposalId(parseInt(pid));
  }, []);

  // Read total proposals count
  const { data: proposalCountData, refetch: refetchCount } = useContractRead({
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
          const resp = await (window as any).viemPublicClient?.readContract?.({
            address: GOVERNANCE_CONFIG.address,
            abi: GOVERNANCE_CONFIG.abi,
            functionName: 'getProposal',
            args: [BigInt(i)],
          });
          if (resp) arr.push(resp);
        } catch (e) {
          // Ignore read errors for demo
        }
      }
      setProposals(arr);
    }
    loadProposals();
  }, [proposalCountData]);

  // Prepare createProposal
  const canCreate = title.trim().length > 0;
  const { config: createConfig } = usePrepareContractWrite({
    address: GOVERNANCE_CONFIG.address,
    abi: GOVERNANCE_CONFIG.abi,
    functionName: 'createProposal',
    args: canCreate ? [title, description, url] : undefined,
    enabled: canCreate,
  });
  const { data: createData, write: createWrite } = useContractWrite(createConfig);
  const { isSuccess: createSuccess } = useWaitForTransaction({ hash: createData?.hash });

  useEffect(() => {
    if (createSuccess) {
      setTitle('');
      setDescription('');
      setUrl('');
      refetchCount?.();
    }
  }, [createSuccess]);

  // Voting
  const [voteTargetId, setVoteTargetId] = useState<number | null>(null);
  const [voteSupport, setVoteSupport] = useState<boolean>(true);
  const { config: voteConfig } = usePrepareContractWrite({
    address: GOVERNANCE_CONFIG.address,
    abi: GOVERNANCE_CONFIG.abi,
    functionName: 'vote',
    args: voteTargetId ? [BigInt(voteTargetId), voteSupport] : undefined,
    enabled: Boolean(voteTargetId !== null),
  });
  const { data: voteData, write: voteWrite } = useContractWrite(voteConfig);
  const { isSuccess: voteSuccess } = useWaitForTransaction({ hash: voteData?.hash });

  useEffect(() => {
    if (voteSuccess) {
      setVoteTargetId(null);
      refetchCount?.();
    }
  }, [voteSuccess]);

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
                <button className="btn-primary" onClick={() => createWrite?.()} disabled={!canCreate || !createWrite}>
                  <Icon icon="ph:plus-circle" className="w-5 h-5 mr-2" />
                  Submit Proposal
                </button>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Voting</h3>
            <p className="text-sm text-gray-600">Pick a proposal and cast your vote.</p>
            <div className="flex items-center space-x-2 mt-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700">Proposal ID</label>
                <input
                  className="input-field"
                  placeholder="e.g., 3"
                  value={voteTargetId || selectedProposalId || ''}
                  onChange={(e) => setVoteTargetId(parseInt(e.target.value))}
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
              <button className="btn-primary" onClick={() => voteWrite?.()} disabled={!voteWrite}>
                <Icon icon="ph:checks" className="w-5 h-5 mr-2" />
                Vote
              </button>
            </div>
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
                  <p className="text-gray-900 font-medium">{p.title}</p>
                  <p className="text-xs text-gray-600 break-words">{p.description}</p>
                  {p.url && (
                    <a className="text-xs text-indigo-600 underline" href={p.url} target="_blank" rel="noreferrer">External link</a>
                  )}
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {p.closed ? 'Closed' : 'Open'}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-gray-600">For: <span className="font-medium text-gray-900">{Number(p.forVotes)}</span> • Against: <span className="font-medium text-gray-900">{Number(p.againstVotes)}</span></div>
                <div className="flex items-center space-x-2">
                  <button className="btn-secondary text-xs" onClick={() => setVoteTargetId(Number(p.id))}>
                    <Icon icon="ph:checks" className="w-4 h-4 mr-1" /> Vote
                  </button>
                  <button className="btn-secondary text-xs" onClick={() => handleShareLink(Number(p.id))}>
                    <Icon icon="ph:link-simple" className="w-4 h-4 mr-1" /> Share
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