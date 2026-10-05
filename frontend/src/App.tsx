import { useState } from 'react'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  FileSpreadsheet,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'

interface Protocol {
  id: string
  code: string
  title: string
  phase: string
  pi: string
  enrolled: number
  target: number
  status: 'ACTIVE' | 'PENDING' | 'UNDER_REVIEW' | 'DRAFT'
  lastUpdated: string
}

const mockProtocols: Protocol[] = [
  {
    id: '1',
    code: 'AYU-CT-2026-001',
    title: 'Multi-Center Randomized Trial on Ashwagandha Formulation for Cognitive Health',
    phase: 'Phase II',
    pi: 'Dr. Rajesh Sharma',
    enrolled: 84,
    target: 120,
    status: 'ACTIVE',
    lastUpdated: '2026-10-04',
  },
  {
    id: '2',
    code: 'AYU-CT-2026-004',
    title: 'Standardized Curcumin Adjunct Therapy in Metabolic Syndrome',
    phase: 'Phase III',
    pi: 'Dr. Priya Sundaram',
    enrolled: 156,
    target: 200,
    status: 'ACTIVE',
    lastUpdated: '2026-10-03',
  },
  {
    id: '3',
    code: 'AYU-CT-2026-007',
    title: 'Safety and Tolerability Profile of Triphala Nano-formulation',
    phase: 'Phase I',
    pi: 'Dr. Ananya Roy',
    enrolled: 18,
    target: 30,
    status: 'PENDING',
    lastUpdated: '2026-09-28',
  },
  {
    id: '4',
    code: 'AYU-CT-2026-009',
    title: 'Guduchi Extract Efficacy in Post-Viral Fatigue Syndromes',
    phase: 'Phase II',
    pi: 'Dr. Vikramaditya Joshi',
    enrolled: 0,
    target: 80,
    status: 'UNDER_REVIEW',
    lastUpdated: '2026-09-25',
  },
]

export default function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  const filteredProtocols = mockProtocols.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pi.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1C1A17] font-sans flex flex-col">
      {/* Top Institutional Header */}
      <header className="bg-[#5C1F0D] text-white border-b-2 border-[#B8862E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#7A2A12] border border-[#B8862E]/50 flex items-center justify-center rounded-sm text-[#B8862E]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-wide">AyuCTMS</span>
                <span className="text-[10px] bg-[#B8862E] text-white uppercase px-1.5 py-0.5 rounded-sm font-semibold tracking-wider">
                  Clinical Trial Platform
                </span>
              </div>
              <p className="text-xs text-white/80 font-normal">
                Ministry of Ayush • Institutional Research & Regulatory Compliance System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-white/90">
              <span className="inline-block w-2 h-2 rounded-full bg-[#1F5C3F] border border-white"></span>
              <span>Central Node: Connected</span>
            </div>
            <div className="border-l border-white/20 pl-4 py-1 flex items-center gap-2">
              <div className="text-right">
                <div className="font-semibold text-white">Investigator Portal</div>
                <div className="text-[11px] text-white/70">AIIA Delhi Hub</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Title & Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4DED3] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#5A5347] mb-1 font-medium">
              <span>Home</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Trials Registry</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#7A2A12] font-semibold">Active Protocols</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1A17] tracking-tight">
              Clinical Protocol Directory
            </h1>
            <p className="text-sm text-[#5A5347] mt-1">
              GCP-compliant trial oversight, protocol auditing, and cohort monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-[#C9C2B3] text-[#1C1A17] rounded-sm hover:bg-[#F8F6F2] hover:border-[#7A2A12] transition-colors focus:outline-2 focus:outline-[#B8862E] cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#7A2A12]" />
              Export Report
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#7A2A12] hover:bg-[#5C1F0D] text-white rounded-sm shadow-xs transition-colors focus:outline-2 focus:outline-[#B8862E] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Protocol Registration
            </button>
          </div>
        </div>

        {/* Clinical Metrics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E4DED3] border-l-4 border-l-[#7A2A12] p-4 rounded-xs shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5A5347]">
                Total Protocols
              </span>
              <Database className="w-4 h-4 text-[#7A2A12]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-[#1C1A17]">14</span>
              <span className="text-xs font-medium text-[#1F5C3F]">+2 this month</span>
            </div>
            <p className="text-[11px] text-[#726B5C] mt-1">Across 6 accredited research sites</p>
          </div>

          <div className="bg-white border border-[#E4DED3] border-l-4 border-l-[#1F5C3F] p-4 rounded-xs shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5A5347]">
                Active Enrolled
              </span>
              <Users className="w-4 h-4 text-[#1F5C3F]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-[#1C1A17]">258</span>
              <span className="text-xs text-[#5A5347]">/ 430 Target</span>
            </div>
            <p className="text-[11px] text-[#726B5C] mt-1">60.0% recruitment milestone achieved</p>
          </div>

          <div className="bg-white border border-[#E4DED3] border-l-4 border-l-[#B8862E] p-4 rounded-xs shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5A5347]">
                Pending Approvals
              </span>
              <Clock className="w-4 h-4 text-[#B8862E]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-[#1C1A17]">3</span>
              <span className="text-xs font-medium text-[#B8862E]">Ethics Committee</span>
            </div>
            <p className="text-[11px] text-[#726B5C] mt-1">Next review scheduled: 08 Oct 2026</p>
          </div>

          <div className="bg-white border border-[#E4DED3] border-l-4 border-l-[#9B2C2C] p-4 rounded-xs shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5A5347]">
                Safety Adverse Alerts
              </span>
              <AlertCircle className="w-4 h-4 text-[#9B2C2C]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-[#1C1A17]">0</span>
              <span className="text-xs font-medium text-[#1F5C3F]">Clean safety log</span>
            </div>
            <p className="text-[11px] text-[#726B5C] mt-1">No Grade III/IV SAE reported</p>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="bg-white border border-[#E4DED3] p-4 rounded-xs shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#726B5C]" />
            <input
              type="text"
              placeholder="Search by protocol title, code, or investigator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#C9C2B3] rounded-xs bg-[#FFFFFF] text-[#1C1A17] focus:outline-2 focus:outline-[#B8862E] focus:border-[#7A2A12]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-3.5 h-3.5 text-[#5A5347] shrink-0" />
            <span className="text-xs font-semibold text-[#5A5347] uppercase tracking-wider shrink-0">
              Filter:
            </span>
            {(['ALL', 'ACTIVE', 'PENDING', 'UNDER_REVIEW'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xs border transition-colors cursor-pointer shrink-0 ${
                  selectedStatus === status
                    ? 'bg-[#7A2A12] border-[#7A2A12] text-white'
                    : 'bg-white border-[#E4DED3] text-[#5A5347] hover:border-[#C9C2B3]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        {/* Protocol Table */}
        <section className="bg-white border border-[#E4DED3] rounded-xs shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E4DED3] flex items-center justify-between bg-[#FFFFFF]">
            <h2 className="font-serif text-base font-bold text-[#1C1A17]">
              Registered Clinical Trials ({filteredProtocols.length})
            </h2>
            <span className="text-xs text-[#5A5347]">
              Showing current institutional portfolio
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F6F2] border-b border-[#E4DED3] text-[#5A5347] font-semibold">
                  <th className="py-3 px-4">Code / Phase</th>
                  <th className="py-3 px-4">Study Title</th>
                  <th className="py-3 px-4">Principal Investigator</th>
                  <th className="py-3 px-4">Enrollment Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DED3]">
                {filteredProtocols.map((protocol) => {
                  const percentage = Math.round((protocol.enrolled / protocol.target) * 100)
                  return (
                    <tr
                      key={protocol.id}
                      className="hover:bg-[#F8F6F2]/70 transition-colors"
                    >
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="font-mono font-bold text-[#7A2A12]">
                          {protocol.code}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] uppercase font-semibold text-[#5A5347] bg-[#E4DED3]/60 px-1.5 py-0.5 rounded-xs">
                          {protocol.phase}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top max-w-sm">
                        <div className="font-medium text-[#1C1A17] line-clamp-2">
                          {protocol.title}
                        </div>
                        <div className="text-[11px] text-[#726B5C] mt-0.5">
                          Last Updated: {protocol.lastUpdated}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="text-[#1C1A17] font-medium">{protocol.pi}</div>
                        <div className="text-[11px] text-[#726B5C]">Department of Kayachikitsa</div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-[#1C1A17]">{protocol.enrolled}</span>
                          <span className="text-[#726B5C]">/ {protocol.target} ({percentage}%)</span>
                        </div>
                        <div className="w-32 bg-[#E4DED3] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#1F5C3F] h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        {protocol.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-semibold bg-[#1F5C3F]/10 text-[#1F5C3F] border border-[#1F5C3F]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                        {protocol.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-semibold bg-[#B8862E]/10 text-[#B8862E] border border-[#B8862E]/30">
                            <Clock className="w-3 h-3" />
                            PENDING
                          </span>
                        )}
                        {protocol.status === 'UNDER_REVIEW' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-semibold bg-[#315A78]/10 text-[#315A78] border border-[#315A78]/30">
                            <Activity className="w-3 h-3" />
                            UNDER REVIEW
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="px-2.5 py-1 text-xs font-semibold text-[#7A2A12] border border-[#7A2A12] hover:bg-[#7A2A12] hover:text-white rounded-xs transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredProtocols.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#726B5C]">
                      No protocols match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Institutional Footer */}
      <footer className="mt-auto border-t border-[#E4DED3] bg-[#FFFFFF] text-xs text-[#5A5347] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="font-serif font-bold text-[#7A2A12]">AyuCTMS</span> — Institutional Clinical Trials Registry & Oversight.
            <div className="text-[11px] text-[#726B5C] mt-0.5">
              Strictly following Good Clinical Practice (GCP) and ICMR-AYUSH guidelines.
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="#compliance" className="hover:text-[#7A2A12] underline underline-offset-2">Compliance</a>
            <a href="#audit" className="hover:text-[#7A2A12] underline underline-offset-2">Audit Logs</a>
            <a href="#support" className="hover:text-[#7A2A12] underline underline-offset-2">Technical Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
