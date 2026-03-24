import type { Report, Analysis } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_REPORT
//
// A single realistic fixture used during development and when
// USE_MOCK_PIPELINE=true. It represents the "NovaDEX Protocol" demo project.
//
// Every field here must satisfy the Report type. When real pipeline output
// replaces this, it must produce the same shape.
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_REPORT: Report = {
  id: 'rpt_mock_001',
  analysisId: 'anl_mock_001',
  projectName: 'NovaDEX Protocol',
  projectCategory: 'Decentralized Exchange (DEX) · Layer 2',
  createdAt: new Date().toISOString(),

  executiveSummary:
    'NovaDEX Protocol presents itself as a Layer 2 decentralized exchange with a novel ' +
    '"concentrated liquidity routing" mechanism designed to reduce slippage for high-volume ' +
    'trades. A working testnet application was accessible at time of screening. The whitepaper ' +
    'is present but contains minimal technical specificity on the routing algorithm. The team ' +
    'is fully anonymous. No independent audit was found. Token distribution lacks vesting ' +
    'schedule specifics. Several indicators require further human verification before forming ' +
    'any assessment.',

  screeningOutcome: 'verify',
  outcomeRationale:
    'Multiple claims remain unverifiable from public sources. Team identity is anonymous with ' +
    'no verifiable history. Tokenomics documentation is incomplete. Manual research is required ' +
    'before forming a view.',

  projectOverview: {
    whatItDoes:
      'A DEX on an L2 network offering concentrated liquidity, cross-chain routing, and reduced gas costs for large swap volumes.',
    whoItsFor:
      'DeFi traders seeking lower slippage on large positions; liquidity providers seeking higher capital efficiency.',
    tokenUtility:
      'Governance voting; fee discount for NOVA holders; staking for protocol revenue share. Utility is documented but implementation timeline is vague.',
    differentiators:
      '"Smart routing" across liquidity pools; intent-based order flow (claimed); MEV protection layer (unverified).',
    unansweredQuestions: [
      'How does the routing algorithm differ from Uniswap V3 technically?',
      'Who are the founders and what is their prior track record?',
      'What are the exact vesting terms for the 18% team allocation?',
      'Has any third-party security audit been conducted?',
      'What is the unlock schedule for presale investor tokens?',
    ],
  },

  riskSections: [
    {
      category: 'clarity',
      riskLevel: 'medium',
      reasoning:
        'The project website is live and includes a whitepaper, a working testnet, and a ' +
        'documented roadmap. However, the whitepaper lacks technical depth on the core routing ' +
        'mechanism — the primary claimed differentiator. Roadmap milestones lack dates.',
      verificationStatus: 'inferred',
      findings: [
        { text: 'Whitepaper present — 14 pages, lacks algorithm specifics', verificationStatus: 'verified', sourceUrl: 'https://novadex.io/whitepaper.pdf' },
        { text: 'Testnet application accessible at time of screening', verificationStatus: 'verified', sourceUrl: 'https://app.novadex.io' },
        { text: 'Roadmap present but milestones are undated', verificationStatus: 'inferred', sourceUrl: null },
        { text: 'GitHub linked — last commit 3 weeks ago', verificationStatus: 'verified', sourceUrl: 'https://github.com/NovaDEX' },
        { text: '"MEV protection" claim has no technical explanation', verificationStatus: 'unknown', sourceUrl: null },
      ],
    },
    {
      category: 'team',
      riskLevel: 'high',
      reasoning:
        'The team page lists four contributors under pseudonyms only. No verifiable LinkedIn ' +
        'profiles, GitHub accounts tied to real identities, or prior project history was found. ' +
        'This is a significant unknown that requires manual investigation.',
      verificationStatus: 'unknown',
      findings: [
        { text: 'Team page exists — 4 pseudonymous contributors listed', verificationStatus: 'verified', sourceUrl: 'https://novadex.io/team' },
        { text: 'No verifiable real identities or professional history found', verificationStatus: 'unknown', sourceUrl: null },
        { text: 'No prior project track record discoverable', verificationStatus: 'unknown', sourceUrl: null },
        { text: 'No advisors listed or verifiable', verificationStatus: 'unknown', sourceUrl: null },
      ],
    },
    {
      category: 'tokenomics',
      riskLevel: 'medium',
      reasoning:
        'Token distribution is documented: 18% team, 15% investors, 30% ecosystem, 22% ' +
        'community, 15% treasury. Vesting schedule terms are not publicly disclosed. No ' +
        'on-chain vesting contract was identified. The 33% team + investor allocation without ' +
        'vesting terms is a meaningful risk indicator.',
      verificationStatus: 'inferred',
      findings: [
        { text: 'Token distribution percentages documented on website', verificationStatus: 'verified', sourceUrl: 'https://novadex.io/tokenomics' },
        { text: 'Vesting schedule terms not publicly disclosed', verificationStatus: 'unknown', sourceUrl: null },
        { text: 'No on-chain vesting contract found or linked', verificationStatus: 'unknown', sourceUrl: null },
        { text: 'Emission rate described vaguely — "controlled release"', verificationStatus: 'inferred', sourceUrl: null },
        { text: '33% team + investor allocation without vesting is a risk indicator', verificationStatus: 'inferred', sourceUrl: null },
      ],
    },
    {
      category: 'contract',
      riskLevel: 'high',
      reasoning:
        'No independent security audit was found. Contract source code is verified on-chain. ' +
        'A proxy (EIP-1967) pattern was detected — the deployer retains upgrade rights. ' +
        'The absence of a third-party audit for a DEX handling user funds is a significant risk indicator.',
      verificationStatus: 'inferred',
      findings: [
        { text: 'Contract source verified on explorer', verificationStatus: 'verified', sourceUrl: 'https://etherscan.io/address/0x3f4a' },
        { text: 'No third-party security audit found — significant risk indicator', verificationStatus: 'unknown', sourceUrl: null },
        { text: 'Proxy/upgradeable pattern detected — owner retains upgrade rights', verificationStatus: 'verified', sourceUrl: null },
        { text: 'Contract ownership not renounced', verificationStatus: 'verified', sourceUrl: null },
        { text: 'No honeypot indicators detected in basic checks', verificationStatus: 'inferred', sourceUrl: null },
      ],
    },
    {
      category: 'market',
      riskLevel: 'medium',
      reasoning:
        'Token not yet listed on major CEXes. DEX liquidity pool TVL is approximately $180K — ' +
        'thin for a DEX with institutional liquidity claims. Top 10 wallets hold ~62% of supply. ' +
        'Volume patterns appear organic but the dataset is insufficient for strong conclusions.',
      verificationStatus: 'inferred',
      findings: [
        { text: 'No major CEX listing found at time of screening', verificationStatus: 'verified', sourceUrl: null },
        { text: 'DEX liquidity pool TVL ~$180K — low for institutional claims', verificationStatus: 'inferred', sourceUrl: null },
        { text: 'Top 10 wallets hold ~62% of supply', verificationStatus: 'inferred', sourceUrl: null },
        { text: 'No anomalous volume spikes in 7-day window reviewed', verificationStatus: 'inferred', sourceUrl: null },
      ],
    },
    {
      category: 'social',
      riskLevel: 'low',
      reasoning:
        'Twitter/X account is active with consistent messaging. Telegram has ~4,200 members ' +
        'with regular updates. Documentation is present and consistent with website claims. ' +
        'No contradictions between social messaging and official docs were found.',
      verificationStatus: 'verified',
      findings: [
        { text: 'Twitter/X: active, ~12K followers, messaging consistent', verificationStatus: 'verified', sourceUrl: 'https://twitter.com/NovaDEX_io' },
        { text: 'Telegram: ~4,200 members, regular team updates', verificationStatus: 'verified', sourceUrl: null },
        { text: 'Docs site present and internally consistent', verificationStatus: 'verified', sourceUrl: 'https://docs.novadex.io' },
        { text: 'No whitepaper plagiarism detected in surface check', verificationStatus: 'inferred', sourceUrl: null },
      ],
    },
  ],

  claims: [
    {
      claimText: 'Novel routing reduces slippage by 40%',
      evidence: 'No benchmark or methodology published',
      verificationStatus: 'unknown',
      sourceUrl: null,
    },
    {
      claimText: 'MEV protection layer active on mainnet',
      evidence: 'Claimed on website; no technical explanation or audit found',
      verificationStatus: 'unknown',
      sourceUrl: 'https://novadex.io',
    },
    {
      claimText: 'Testnet is live and functional',
      evidence: 'Accessed testnet directly during screening',
      verificationStatus: 'verified',
      sourceUrl: 'https://app.novadex.io',
    },
    {
      claimText: 'Smart contract audited by a reputable firm',
      evidence: 'No audit report found; no firm named on site',
      verificationStatus: 'unknown',
      sourceUrl: null,
    },
    {
      claimText: 'Protocol revenue shared with stakers',
      evidence: 'Described in tokenomics doc; not yet live per roadmap',
      verificationStatus: 'inferred',
      sourceUrl: 'https://novadex.io/tokenomics',
    },
    {
      claimText: 'Team has combined 15 years DeFi experience',
      evidence: 'Cannot verify — team is fully anonymous',
      verificationStatus: 'unknown',
      sourceUrl: null,
    },
  ],

  sources: [
    {
      url: 'https://novadex.io',
      sourceType: 'website',
      excerpt:
        '"NovaDEX is the next generation DEX built on L2 with concentrated liquidity routing and MEV protection."',
      confidence: 'medium',
      accessedAt: new Date().toISOString(),
    },
    {
      url: 'https://novadex.io/whitepaper.pdf',
      sourceType: 'whitepaper',
      excerpt:
        '14-page document. Technical sections lack algorithm specifics. Tokenomics distribution table present.',
      confidence: 'medium',
      accessedAt: new Date().toISOString(),
    },
    {
      url: 'Explorer: 0x3f4a...b7c2',
      sourceType: 'onchain',
      excerpt:
        'Contract source verified. Proxy pattern (EIP-1967). Ownership not renounced. No audit linked in contract metadata.',
      confidence: 'high',
      accessedAt: new Date().toISOString(),
    },
    {
      url: 'https://twitter.com/NovaDEX_io',
      sourceType: 'social',
      excerpt: 'Active account. 12.1K followers. Tweets consistent with project claims. Last post: 18 hours ago.',
      confidence: 'medium',
      accessedAt: new Date().toISOString(),
    },
    {
      url: null,
      sourceType: 'inferred',
      excerpt:
        'Searched CertiK, Quantstamp, Trail of Bits, Hacken, PeckShield registries. No audit found for this project or contract address.',
      confidence: 'high',
      accessedAt: new Date().toISOString(),
    },
  ],

  manualChecks: [
    {
      action: 'Verify team identity and prior track record',
      rationale:
        'Team is fully anonymous. Manual research into pseudonym histories, GitHub contributions, and cross-referencing with prior projects is essential.',
      whereToCheck: 'LinkedIn, GitHub, Twitter/Farcaster history',
      priority: 'high',
    },
    {
      action: 'Request and review the full security audit report',
      rationale:
        'No audit was found. For a DEX handling user funds, this is a prerequisite for meaningful risk assessment.',
      whereToCheck: 'Community Discord/Telegram, direct team contact, audit firm registries',
      priority: 'high',
    },
    {
      action: 'Obtain vesting schedule details for team and investor allocations',
      rationale:
        '33% of supply allocated to team and investors with no disclosed vesting terms. Cliff periods and lock durations are critical for understanding sell pressure risk.',
      whereToCheck: 'Project docs, investor decks, on-chain vesting contracts',
      priority: 'high',
    },
    {
      action: 'Test the routing claim on-chain against a comparable DEX',
      rationale:
        'The "40% slippage reduction" claim requires empirical testing against Uniswap V3 on identical trade sizes.',
      whereToCheck: 'Testnet / mainnet using identical trade parameters',
      priority: 'medium',
    },
    {
      action: 'Review on-chain holder concentration and top wallet activity',
      rationale:
        'Top 10 wallets hold ~62% of supply. Investigate whether these are exchange cold wallets, team wallets, or concentrated speculative holders.',
      whereToCheck: 'Etherscan token holder tab, Nansen, Arkham',
      priority: 'medium',
    },
    {
      action: 'Read the GitHub commit history for code authenticity',
      rationale:
        'Manually verify whether commit history shows genuine development activity and whether code appears original vs forked without attribution.',
      whereToCheck: 'github.com/NovaDEX — commit history, contributors, issues',
      priority: 'medium',
    },
    {
      action: 'Verify investor and partner claims independently',
      rationale:
        'Website mentions "backed by leading DeFi funds" without naming them. This should be confirmed through fund portfolio pages, not taken at face value.',
      whereToCheck: 'Named fund portfolio pages, AngelList, Crunchbase',
      priority: 'low',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK_ANALYSIS — wraps the report, mirrors what the DB returns
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ANALYSIS: Analysis = {
  id: 'anl_mock_001',
  status: 'complete',
  input: {
    url: 'https://novadex.io',
    symbol: 'NOVA',
    contractAddress: '0x3f4a...b7c2',
  },
  report: MOCK_REPORT,
  createdAt: new Date().toISOString(),
}
