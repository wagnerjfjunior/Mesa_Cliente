import React, { useEffect, useMemo, useState } from "react";

// ===================== Utilitários =====================
const formatBRL = (v) => {
  if (!isFinite(v)) return "-";
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
};

const uid = () => Math.random().toString(36).slice(2, 10);

// ===================== Mock de dados =====================
const EMPREENDIMENTOS = [
  {
    slug: "bosque-vila-nova-conceicao",
    nome: "Bosque Vila Nova Conceição",
    bairro: "Vila Nova Conceição",
    cidade: "São Paulo",
    incorporadora: "AW Realty",
    status: "Lançamento",
    entrega_prevista_iso: "2028-09-30",
    unidades: [
      {
        id: "b194a",
        tipo: "Apartamento",
        area_m2: 194,
        dormitorios: 3,
        suites: 3,
        vagas: 3,
        preco_brl: 5950000,
        torre: "Única",
        coluna: "A",
      },
      {
        id: "b237a",
        tipo: "Apartamento",
        area_m2: 237,
        dormitorios: 4,
        suites: 4,
        vagas: 4,
        preco_brl: 7300000,
        torre: "Única",
        coluna: "B",
      },
      {
        id: "b430p",
        tipo: "Penthouse",
        area_m2: 430,
        dormitorios: 4,
        suites: 4,
        vagas: 4,
        preco_brl: 12900000,
        torre: "Cobertura",
        coluna: "PH",
      },
    ],
  },
  {
    slug: "sereno-jardim-sp",
    nome: "Sereno Jardim São Paulo",
    bairro: "Jardim São Paulo",
    cidade: "São Paulo",
    incorporadora: "AW Realty",
    status: "Em construção",
    entrega_prevista_iso: "2027-06-30",
    unidades: [
      {
        id: "s67a",
        tipo: "Apartamento",
        area_m2: 67,
        dormitorios: 2,
        suites: 1,
        vagas: 1,
        preco_brl: 930000,
        torre: "T1",
        coluna: "03",
      },
      {
        id: "s91a",
        tipo: "Apartamento",
        area_m2: 91,
        dormitorios: 3,
        suites: 1,
        vagas: 2,
        preco_brl: 1280000,
        torre: "T1",
        coluna: "05",
      },
      {
        id: "s127a",
        tipo: "Apartamento",
        area_m2: 127,
        dormitorios: 3,
        suites: 2,
        vagas: 2,
        preco_brl: 1780000,
        torre: "T2",
        coluna: "01",
      },
    ],
  },
];

const CLIENTES = [
  {
    id: uid(),
    nome: "Bianca Alves",
    telefone: "(11) 9 8888-1111",
    email: "bianca@email.com",
    status: "instalou",
    lastActivity: Date.now() - 3600_000 * 5,
    empreendimentoSlug: "sereno-jardim-sp",
    sims: 1,
  },
  {
    id: uid(),
    nome: "Lucas Rocha",
    telefone: "(11) 9 7777-2222",
    email: "lucas@email.com",
    status: "simulando",
    lastActivity: Date.now() - 3600_000 * 2,
    empreendimentoSlug: "sereno-jardim-sp",
    sims: 3,
  },
  {
    id: uid(),
    nome: "Thiago Blaco",
    telefone: "(11) 9 6666-3333",
    email: "thiago@email.com",
    status: "proposta",
    lastActivity: Date.now() - 3600_000 * 8,
    empreendimentoSlug: "bosque-vila-nova-conceicao",
    sims: 2,
  },
  {
    id: uid(),
    nome: "Leni Souza",
    telefone: "(11) 9 5555-4444",
    email: "leni@email.com",
    status: "aprovado",
    lastActivity: Date.now() - 3600_000 * 24,
    empreendimentoSlug: "bosque-vila-nova-conceicao",
    sims: 4,
  },
];

function countByStatus(list, s) {
  return list.filter((c) => c.status === s).length;
}

// ===================== Persistência (localStorage) =====================
const LS_JOBS = "mvp_jobs";
const LS_LAST_SIM = "mvp_last_sim";
const LS_SIMS = "mvp_sims";
const LS_USER = "mvp_user";

const loadLastSim = () => {
  try {
    const v = localStorage.getItem(LS_LAST_SIM);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
const saveLastSim = (s) => localStorage.setItem(LS_LAST_SIM, JSON.stringify(s));
const loadSims = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_SIMS) || "[]");
  } catch {
    return [];
  }
};
const saveSims = (arr) => localStorage.setItem(LS_SIMS, JSON.stringify(arr));
const loadUser = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_USER) || "null");
  } catch {
    return null;
  }
};
const saveUser = (u) => localStorage.setItem(LS_USER, JSON.stringify(u));

// ===================== UI Helpers =====================
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-2xl text-sm font-medium mr-2 mb-2 border ${
      active
        ? "bg-black text-white border-black"
        : "bg-white text-black border-gray-300 hover:bg-gray-100"
    }`}
  >
    {children}
  </button>
);

const Card = ({ children, className }) => (
  <div
    className={`rounded-2xl shadow-sm border border-gray-200 p-4 ${
      className || ""
    }`}
  >
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-lg font-semibold mb-3">{children}</h3>
);

// ===================== Timeline simples =====================
const Timeline = ({ items }) => (
  <div className="flex flex-col gap-3">
    {items.map((it, idx) => (
      <div key={idx} className="flex items-center gap-3">
        <div className="w-40 text-sm text-gray-600">{it.label}</div>
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, it.value > 0 ? 100 / (idx + 1) : 0)
              )}%`,
              background: "linear-gradient(90deg, #111 0%, #444 100%)",
            }}
          />
        </div>
        <div className="w-44 text-right text-sm font-medium">
          {formatBRL(it.value)}
        </div>
      </div>
    ))}
  </div>
);

// ===================== CSV helper =====================
function buildUnitsCSV(emp) {
  const header = [
    "tipo",
    "area_m2",
    "dormitorios",
    "suites",
    "vagas",
    "torre",
    "coluna",
    "preco_brl",
  ];
  const rows = emp.unidades.map((u) => [
    u.tipo,
    u.area_m2,
    u.dormitorios,
    u.suites,
    u.vagas,
    u.torre || "",
    u.coluna || "",
    u.preco_brl,
  ]);
  return [header.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
}

// ===================== Download helper =====================
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ===================== Jobs (mock Make) =====================
const loadJobs = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_JOBS) || "[]");
  } catch {
    return [];
  }
};
const saveJobs = (jobs) => localStorage.setItem(LS_JOBS, JSON.stringify(jobs));

function simulateMakeProcessing(job) {
  const jobs = loadJobs();
  jobs.push(job);
  saveJobs(jobs);
  setTimeout(() => {
    const all = loadJobs().map((j) =>
      j.id === job.id ? { ...j, status: "running" } : j
    );
    saveJobs(all);
  }, 700);
  setTimeout(() => {
    const all = loadJobs().map((j) =>
      j.id === job.id ? { ...j, status: "done", resultSlug: j.projetoSlug } : j
    );
    saveJobs(all);
  }, 1800);
}

// ===================== Gráfico SVG leve =====================
function maxOfSeries(data, keys) {
  const vals = keys.flatMap((k) => data.map((d) => Number(d[k] ?? 0)));
  const m = Math.max(0, ...vals);
  return m > 0 ? m : 1;
}

const paletteDash = [undefined, "4 2", "2 2"];

const SvgLineChart = ({ data, xKey, series }) => {
  const W = 760,
    H = 240;
  const PAD_L = 40,
    PAD_R = 10,
    PAD_T = 20,
    PAD_B = 28;
  const keys = series.map((s) => s.key);
  const yMax = maxOfSeries(data, keys);
  const xCount = Math.max(1, data.length);
  const xTo = (i) =>
    PAD_L + (i * (W - PAD_L - PAD_R)) / Math.max(1, xCount - 1);
  const yTo = (v) => H - PAD_B - (v / yMax) * (H - PAD_T - PAD_B);

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((yMax / ticks) * i)
  );

  return (
    <div style={{ width: "100%", height: 260 }}>
      <svg
        width="100%"
        height="260"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {yTicks.map((tv, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              y1={yTo(tv)}
              x2={W - PAD_R}
              y2={yTo(tv)}
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />
            <text
              x={PAD_L - 6}
              y={yTo(tv)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {tv}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <text
            key={i}
            x={xTo(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            {String(d[xKey] ?? "")}
          </text>
        ))}
        {series.map((s, idx) => {
          const d = data
            .map(
              (row, i) =>
                `${i === 0 ? "M" : "L"} ${xTo(i)} ${yTo(
                  Number(row[s.key] || 0)
                )}`
            )
            .join(" ");
          return (
            <path
              key={s.key}
              d={d}
              fill="none"
              stroke="#111"
              strokeWidth={2}
              strokeDasharray={paletteDash[idx % paletteDash.length]}
            />
          );
        })}
        {series.map((s, idx) => (
          <g key={s.key} transform={`translate(${PAD_L + idx * 160}, ${10})`}>
            <line
              x1={0}
              y1={0}
              x2={18}
              y2={0}
              stroke="#111"
              strokeWidth={2}
              strokeDasharray={paletteDash[idx % paletteDash.length]}
            />
            <text
              x={22}
              y={0}
              dominantBaseline="middle"
              fontSize="12"
              fill="#111"
            >
              {s.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

function useCampaignSeries(intervalMs = 15000) {
  const [data, setData] = useState([]);
  useEffect(() => {
    const addPoint = () => {
      const base = 120 + Math.floor(Math.random() * 80);
      const entregues = Math.floor(base * 0.9);
      const abertos = Math.floor(entregues * (0.55 + Math.random() * 0.15));
      const clicados = Math.floor(abertos * (0.5 + Math.random() * 0.2));
      setData((d) => [
        ...d.slice(-19),
        {
          t: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          entregues,
          abertos,
          clicados,
        },
      ]);
    };
    addPoint();
    const id = setInterval(addPoint, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return data;
}

const CampaignsChart = () => {
  const data = useCampaignSeries(15000);
  return (
    <SvgLineChart
      data={data}
      xKey="t"
      series={[
        { key: "entregues", label: "Entregues" },
        { key: "abertos", label: "Abertos", dash: "4 2" },
        { key: "clicados", label: "Clicados", dash: "2 2" },
      ]}
    />
  );
};

const CampaignsHistory = () => {
  const [rows, setRows] = useState([
    {
      titulo: "Promoção Agosto",
      seg: "Simulando",
      enviados: 0,
      entregues: 0,
      abertos: 0,
      clicados: 0,
      ts: new Date().toLocaleString("pt-BR"),
    },
    {
      titulo: "Novidades Bosque",
      seg: "Todos",
      enviados: 0,
      entregues: 0,
      abertos: 0,
      clicados: 0,
      ts: new Date().toLocaleString("pt-BR"),
    },
  ]);
  useEffect(() => {
    const tick = () =>
      setRows((rs) =>
        rs.map((r) => {
          const enviados = 100 + Math.floor(Math.random() * 150);
          const entregues = Math.floor(enviados * 0.9);
          const abertos = Math.floor(entregues * (0.55 + Math.random() * 0.15));
          const clicados = Math.floor(abertos * (0.5 + Math.random() * 0.2));
          return {
            ...r,
            enviados,
            entregues,
            abertos,
            clicados,
            ts: new Date().toLocaleString("pt-BR"),
          };
        })
      );
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="py-2">Título</th>
            <th>Segmento</th>
            <th>Enviados</th>
            <th>Entregues</th>
            <th>Abertos</th>
            <th>Clicados</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="py-2">{r.titulo}</td>
              <td>{r.seg}</td>
              <td>{r.enviados}</td>
              <td>{r.entregues}</td>
              <td>{r.abertos}</td>
              <td>{r.clicados}</td>
              <td>{r.ts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function resolveUnidade(emp, unidadeId) {
  if (!emp || !Array.isArray(emp.unidades) || emp.unidades.length === 0)
    return null;
  const found = unidadeId
    ? emp.unidades.find((u) => u.id === unidadeId)
    : undefined;
  return found || emp.unidades[0];
}

const CorretorAdmin = ({ onOpenCliente }) => {
  const [empSlug, setEmpSlug] = useState(EMPREENDIMENTOS[0].slug);
  const [fileName, setFileName] = useState("");
  const [jobs, setJobs] = useState(loadJobs());
  const [showPreview, setShowPreview] = useState(false);
  const emp = useMemo(
    () => EMPREENDIMENTOS.find((e) => e.slug === empSlug),
    [empSlug]
  );

  useEffect(() => {
    const i = setInterval(() => setJobs(loadJobs()), 800);
    return () => clearInterval(i);
  }, []);

  const handleProcess = () => {
    if (!fileName) {
      alert("Selecione um PDF (mock)");
      return;
    }
    const job = {
      id: uid(),
      projetoSlug: emp.slug,
      filename: fileName,
      status: "queued",
      createdAt: Date.now(),
    };
    simulateMakeProcessing(job);
  };

  return (
    <div className="space-y-6">
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl p-4 relative">
            <button
              className="absolute top-3 right-3 text-sm underline"
              onClick={() => setShowPreview(false)}
            >
              Fechar
            </button>
            <SectionTitle>Prévia do Simulador — {emp.nome}</SectionTitle>
            <div className="max-h-[80vh] overflow-y-auto">
              <ClienteSimulador slug={emp.slug} />
            </div>
          </div>
        </div>
      )}

      <Card>
        <SectionTitle>Dashboard de Clientes</SectionTitle>
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <Card className="text-center">
            <div className="text-xs text-gray-500">Instalaram</div>
            <div className="text-2xl font-semibold">
              {countByStatus(CLIENTES, "instalou")}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-xs text-gray-500">Simulando</div>
            <div className="text-2xl font-semibold">
              {countByStatus(CLIENTES, "simulando")}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-xs text-gray-500">Propostas</div>
            <div className="text-2xl font-semibold">
              {countByStatus(CLIENTES, "proposta")}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-xs text-gray-500">Aprovados</div>
            <div className="text-2xl font-semibold">
              {countByStatus(CLIENTES, "aprovado")}
            </div>
          </Card>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Cliente</th>
                <th>Contato</th>
                <th>Status</th>
                <th>Empreendimento</th>
                <th>Simulações</th>
                <th>Última atividade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {CLIENTES.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2">{c.nome}</td>
                  <td>
                    <div>{c.telefone}</div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </td>
                  <td>
                    {c.status === "instalou" && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        Instalou
                      </span>
                    )}
                    {c.status === "simulando" && (
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                        Simulando
                      </span>
                    )}
                    {c.status === "proposta" && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                        Proposta
                      </span>
                    )}
                    {c.status === "aprovado" && (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                        Aprovado
                      </span>
                    )}
                  </td>
                  <td>
                    {EMPREENDIMENTOS.find(
                      (e) => e.slug === c.empreendimentoSlug
                    )?.nome || c.empreendimentoSlug}
                  </td>
                  <td>{c.sims}</td>
                  <td>{new Date(c.lastActivity).toLocaleString("pt-BR")}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button
                      className="underline"
                      onClick={() => onOpenCliente(c.empreendimentoSlug)}
                    >
                      Ver simulações
                    </button>
                    <button
                      className="underline"
                      onClick={() =>
                        alert(
                          `Push enviado para ${c.nome} (mock)\nMensagem: Promoção/Atualização disponível.`
                        )
                      }
                    >
                      Enviar Push
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle>Campanhas Push</SectionTitle>
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Título</label>
              <input
                type="text"
                className="border rounded-xl px-3 py-2"
                placeholder="Promoção Imperdível"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Segmento</label>
              <select className="border rounded-xl px-3 py-2">
                <option value="all">Todos os clientes</option>
                <option value="instalou">Somente instalou</option>
                <option value="simulando">Somente simulando</option>
                <option value="proposta">Somente proposta</option>
                <option value="aprovado">Somente aprovados</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Mensagem</label>
            <textarea
              className="border rounded-xl px-3 py-2"
              rows={3}
              placeholder="Digite a mensagem promocional ou informativa"
            ></textarea>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">
              Deep Link (opcional)
            </label>
            <input
              type="text"
              className="border rounded-xl px-3 py-2"
              placeholder="simulador://bosque-vila-nova-conceicao"
            />
          </div>
          <button className="bg-black text-white px-4 py-2 rounded-xl">
            Enviar Campanha Push
          </button>
        </div>
        <div className="mt-4">
          <SectionTitle>Histórico de Campanhas</SectionTitle>
          <CampaignsHistory />
        </div>
        <div className="mt-6">
          <SectionTitle>Evolução das Campanhas (tempo real)</SectionTitle>
          <CampaignsChart />
          <p className="text-xs text-gray-500 mt-2">
            Mock: adiciona um ponto novo a cada 15s (entregues, abertos,
            clicados).
          </p>
        </div>
      </Card>

      <Card>
        <SectionTitle>Upload de Tabela (PDF → IA)</SectionTitle>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Empreendimento</label>
            <select
              className="border rounded-xl px-3 py-2"
              value={empSlug}
              onChange={(e) => setEmpSlug(e.target.value)}
            >
              {EMPREENDIMENTOS.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">
              PDF da Tabela (mock)
            </label>
            <input
              type="text"
              placeholder="ex.: tabela_bosque_ago2025.pdf"
              className="border rounded-xl px-3 py-2"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
            <small className="text-gray-500">
              (Wireframe: campo texto simula arquivo)
            </small>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleProcess}
              className="w-full md:w-auto bg-black text-white px-4 py-2 rounded-xl"
            >
              Processar
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Pré-visualização (exemplo do card gerado)</SectionTitle>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-xl p-3">
            <h4 className="font-semibold text-base mb-1">{emp.nome}</h4>
            <p className="text-sm text-gray-600">
              {emp.bairro} · {emp.cidade}
            </p>
            <ul className="list-disc pl-5 my-3 text-sm">
              <li>Infra para carro elétrico</li>
              <li>Portaria controlada</li>
              <li>Fitness e piscina</li>
              <li>Salão de festas</li>
            </ul>
            <p className="text-sm">
              <strong>Unidades (ex.):</strong>{" "}
              {emp.unidades.map((u) => `${u.tipo} ${u.area_m2}m²`).join(", ")}
            </p>
          </div>

          <div className="space-y-2">
            <button
              className="border w-full md:w-auto rounded-xl px-4 py-2"
              onClick={() =>
                download(`${emp.slug}.csv`, buildUnitsCSV(emp), "text/csv")
              }
            >
              Baixar CSV (mock)
            </button>
            <button
              className="border w-full md:w-auto rounded-xl px-4 py-2"
              onClick={() => onOpenCliente(emp.slug)}
            >
              Gerar link do simulador
            </button>
            <button
              className="bg-black text-white w-full md:w-auto rounded-xl px-4 py-2"
              onClick={() => setShowPreview(true)}
            >
              Prévia
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Histórico de Processamentos</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Job ID</th>
                <th>Arquivo</th>
                <th>Empreendimento</th>
                <th>Status</th>
                <th>Atualizado</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {jobs
                .slice()
                .reverse()
                .map((j) => (
                  <tr key={j.id} className="border-t">
                    <td className="py-2 font-mono text-xs">{j.id}</td>
                    <td>{j.filename}</td>
                    <td>
                      {EMPREENDIMENTOS.find((e) => e.slug === j.projetoSlug)
                        ?.nome || j.projetoSlug}
                    </td>
                    <td>
                      {j.status === "done" ? (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                          Concluído
                        </span>
                      ) : j.status === "running" ? (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                          Processando
                        </span>
                      ) : j.status === "queued" ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                          Na fila
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-full">
                          Erro
                        </span>
                      )}
                    </td>
                    <td>{new Date(j.createdAt).toLocaleString("pt-BR")}</td>
                    <td>
                      {j.status === "done" && (
                        <button
                          className="underline"
                          onClick={() => onOpenCliente(j.projetoSlug)}
                        >
                          Abrir simulador
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-gray-500">
                    Nenhum job ainda. Envie um PDF para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const AuthModal = ({ onClose, onSave }) => {
  const [provider, setProvider] = useState("none");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-4 w-full max-w-md space-y-3">
        <SectionTitle>Entrar</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <button
            className={`border rounded-xl px-3 py-2 ${
              provider === "google" ? "bg-gray-100" : ""
            }`}
            onClick={() => setProvider("google")}
          >
            Google
          </button>
          <button
            className={`border rounded-xl px-3 py-2 ${
              provider === "apple" ? "bg-gray-100" : ""
            }`}
            onClick={() => setProvider("apple")}
          >
            Apple
          </button>
          <button
            className={`border rounded-xl px-3 py-2 ${
              provider === "facebook" ? "bg-gray-100" : ""
            }`}
            onClick={() => setProvider("facebook")}
          >
            Facebook
          </button>
        </div>
        <div className="grid gap-2">
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="CPF"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="bg-black text-white rounded-xl px-3 py-2"
            onClick={() =>
              onSave({
                provider: provider === "none" ? "google" : provider,
                nome,
                email,
                telefone,
                cpf,
              })
            }
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

const ClienteSimulador = ({ slug }) => {
  const emp =
    EMPREENDIMENTOS.find((e) => e.slug === slug) || EMPREENDIMENTOS[0];
  const [unidadeId, setUnidadeId] = useState(emp.unidades[0]?.id || "");
  const [entradaPct, setEntradaPct] = useState(0.2);
  const [saldoPct, setSaldoPct] = useState(0.2);
  const [parcelas, setParcelas] = useState(24);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [docs, setDocs] = useState([]);
  const [simTitle, setSimTitle] = useState("Simulação");
  const [sims, setSims] = useState(
    loadSims().filter((s) => s.empreendimento === slug)
  );
  const [user, setUser] = useState(loadUser());
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const valid = emp.unidades.some((u) => u.id === unidadeId);
    if (!valid && emp.unidades[0]) setUnidadeId(emp.unidades[0].id);
  }, [emp, unidadeId]);

  useEffect(() => {
    const last = loadLastSim();
    if (last && last.empreendimento === slug) {
      const maybe = emp.unidades.find((u) => u.id === last.unidadeId);
      setUnidadeId(maybe ? maybe.id : emp.unidades[0]?.id || "");
      setEntradaPct(last.entradaPct);
      setSaldoPct(last.saldoPct);
      setParcelas(last.parcelas);
      setSimTitle(last.title || "Simulação");
    }
  }, [slug]);

  useEffect(() => {
    setSims(loadSims().filter((s) => s.empreendimento === slug));
  }, [slug]);

  const unidade = useMemo(
    () => resolveUnidade(emp, unidadeId),
    [emp, unidadeId]
  );
  const safeUnidadeId = unidade?.id || "";

  const preco = unidade?.preco_brl ?? 0;
  const entrada = Math.round(preco * entradaPct);
  const saldoObra = Math.round(preco * saldoPct);
  const baseParcelar = Math.max(0, preco - entrada - saldoObra);
  const valorParcela = parcelas > 0 ? Math.round(baseParcelar / parcelas) : 0;

  const timelineValues = [
    { label: "Entrada", value: entrada },
    { label: `${parcelas}x Parcelas`, value: baseParcelar },
    { label: "Saldo de Obra", value: saldoObra },
  ];

  const salvarSimulacao = () => {
    if (!safeUnidadeId) {
      alert("Nenhuma unidade disponível para salvar.");
      return;
    }
    const sim = {
      id: uid(),
      title: simTitle || "Minha Simulação",
      empreendimento: slug,
      unidadeId: safeUnidadeId,
      entradaPct,
      saldoPct,
      parcelas,
      createdAt: Date.now(),
    };
    const all = loadSims();
    all.push(sim);
    saveSims(all);
    setSims(all.filter((s) => s.empreendimento === slug));
    saveLastSim(sim);
    alert("Simulação salva (mock)");
  };

  const renomearSim = (id, title) => {
    const all = loadSims().map((s) => (s.id === id ? { ...s, title } : s));
    saveSims(all);
    setSims(all.filter((s) => s.empreendimento === slug));
  };

  const enviarProposta = () => {
    if (!nome || !email || !tel) {
      alert("Preencha nome, e-mail e telefone");
      return;
    }
    alert("Proposta enviada (mock). No real, isso iria para o Make/CRM.");
  };

  const onDocsChange = (files) => {
    if (!files) return;
    setDocs(Array.from(files));
  };

  return (
    <div className="space-y-6">
      {!user && showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSave={(u) => {
            saveUser(u);
            setUser(u);
            setShowAuth(false);
          }}
        />
      )}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {user ? (
            <>
              Conectado: <strong>{user.nome}</strong>{" "}
              {user.email ? `(${user.email})` : ""}
            </>
          ) : (
            "Você não está logado."
          )}
        </div>
        {!user ? (
          <button
            className="border rounded-xl px-3 py-2"
            onClick={() => setShowAuth(true)}
          >
            Entrar
          </button>
        ) : null}
      </div>

      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold">{emp.nome}</h2>
            <p className="text-sm text-gray-600">
              {emp.bairro} · {emp.cidade} ·{" "}
              {unidade
                ? `${unidade.tipo} ${unidade.area_m2}m²`
                : "sem unidades"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Valor de referência</div>
            <div className="text-lg font-semibold">
              {formatBRL(preco)}{" "}
              <span className="text-xs text-gray-500">(simulado)</span>
            </div>
          </div>
        </div>
        {!unidade && (
          <p className="mt-2 text-xs text-rose-600">
            Nenhuma unidade disponível para este empreendimento. Importar tabela
            primeiro.
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle>Monte sua simulação</SectionTitle>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 md:col-span-4">
            <label className="text-sm text-gray-600">Nome da simulação</label>
            <input
              className="border rounded-xl px-3 py-2"
              placeholder="Ex.: Plano 30% entrada"
              value={simTitle}
              onChange={(e) => setSimTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Unidade</label>
            <select
              className="border rounded-xl px-3 py-2"
              value={safeUnidadeId}
              onChange={(e) => setUnidadeId(e.target.value)}
              disabled={!unidade}
            >
              {emp.unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.tipo} · {u.area_m2}m² · {formatBRL(u.preco_brl)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">
              Entrada (%): {Math.round(entradaPct * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={50}
              value={Math.round(entradaPct * 100)}
              onChange={(e) => setEntradaPct(Number(e.target.value) / 100)}
              disabled={!unidade}
            />
            <div className="text-sm">{formatBRL(entrada)}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">
              Saldo de Obra (%): {Math.round(saldoPct * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={50}
              value={Math.round(saldoPct * 100)}
              onChange={(e) => setSaldoPct(Number(e.target.value) / 100)}
              disabled={!unidade}
            />
            <div className="text-sm">{formatBRL(saldoObra)}</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">
              Parcelas (qtd): {parcelas}
            </label>
            <input
              type="range"
              min={0}
              max={60}
              value={parcelas}
              onChange={(e) => setParcelas(Number(e.target.value))}
              disabled={!unidade}
            />
            <div className="text-sm">
              {parcelas > 0
                ? `${parcelas}x de ${formatBRL(valorParcela)}`
                : "—"}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Fluxo de Pagamento</SectionTitle>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Timeline items={timelineValues} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Total</span>
              <strong>{formatBRL(preco)}</strong>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Entrada</span>
              <span>{formatBRL(entrada)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Parcelado</span>
              <span>
                {parcelas > 0 ? `${parcelas}x ${formatBRL(valorParcela)}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Saldo de Obra</span>
              <span>{formatBRL(saldoObra)}</span>
            </div>
            <p className="text-xs text-gray-500">
              * Simulação sem INCC/juros. Valores ilustrativos.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Ações</SectionTitle>
        <div className="grid md:grid-cols-3 gap-3">
          <button
            className="border rounded-xl px-4 py-2"
            onClick={salvarSimulacao}
            disabled={!unidade}
          >
            Salvar Simulação
          </button>
          <button
            className="border rounded-xl px-4 py-2"
            onClick={enviarProposta}
          >
            Enviar Proposta
          </button>
          <label className="border rounded-xl px-4 py-2 text-center cursor-pointer">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onDocsChange(e.target.files)}
            />
            Enviar Documentos
          </label>
        </div>
        {docs.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {docs.length} arquivo(s) selecionado(s) (mock, não enviados)
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle>Minhas simulações</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Nome</th>
                <th>Unidade</th>
                <th>Entrada</th>
                <th>Saldo</th>
                <th>Parcelas</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sims.length > 0 ? (
                sims
                  .slice()
                  .reverse()
                  .map((s) => {
                    const u = resolveUnidade(emp, s.unidadeId);
                    return (
                      <tr key={s.id} className="border-t">
                        <td className="py-2">
                          <input
                            className="border rounded-lg px-2 py-1 w-full"
                            defaultValue={s.title}
                            onBlur={(e) =>
                              renomearSim(s.id, e.target.value || "Sem nome")
                            }
                          />
                        </td>
                        <td>
                          {u ? (
                            `${u.tipo} ${u.area_m2}m²`
                          ) : (
                            <span className="text-rose-600">
                              (unidade indisponível)
                            </span>
                          )}
                        </td>
                        <td>{Math.round(s.entradaPct * 100)}%</td>
                        <td>{Math.round(s.saldoPct * 100)}%</td>
                        <td>{s.parcelas}</td>
                        <td>{new Date(s.createdAt).toLocaleString("pt-BR")}</td>
                        <td className="space-x-2">
                          {u ? (
                            <button
                              className="underline"
                              onClick={() => {
                                setUnidadeId(u.id);
                                setEntradaPct(s.entradaPct);
                                setSaldoPct(s.saldoPct);
                                setParcelas(s.parcelas);
                                setSimTitle(s.title);
                              }}
                            >
                              Abrir
                            </button>
                          ) : (
                            <button
                              className="underline"
                              onClick={() => {
                                if (emp.unidades[0]) {
                                  setUnidadeId(emp.unidades[0].id);
                                  setEntradaPct(s.entradaPct);
                                  setSaldoPct(s.saldoPct);
                                  setParcelas(s.parcelas);
                                  setSimTitle(s.title);
                                }
                              }}
                            >
                              Abrir (ajustar)
                            </button>
                          )}
                          <button
                            className="underline"
                            onClick={() => {
                              const all = loadSims();
                              const dup = {
                                ...s,
                                id: uid(),
                                createdAt: Date.now(),
                                title: s.title + " (cópia)",
                              };
                              all.push(dup);
                              saveSims(all);
                              setSims(
                                all.filter((x) => x.empreendimento === slug)
                              );
                            }}
                          >
                            Duplicar
                          </button>
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-gray-500">
                    Nenhuma simulação salva.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle>Compartilhar</SectionTitle>
        <div className="flex flex-wrap gap-3">
          <button
            className="border rounded-xl px-4 py-2"
            onClick={() => alert("Gerar PDF (mock)")}
          >
            Gerar PDF da Simulação
          </button>
          <button
            className="border rounded-xl px-4 py-2"
            onClick={() => alert("Compartilhar WhatsApp (mock)")}
          >
            Compartilhar no WhatsApp
          </button>
        </div>
      </Card>
    </div>
  );
};

// ---- Testes (smoke + extras) ----
const Tests = () => {
  const [results] = useState(() => {
    const res = [];
    try {
      res.push({
        name: "formatBRL retorna moeda",
        pass: formatBRL(0).includes("R$"),
      });
    } catch {
      res.push({ name: "formatBRL retorna moeda", pass: false });
    }
    try {
      const csv = buildUnitsCSV(EMPREENDIMENTOS[0]);
      res.push({
        name: "CSV inclui cabeçalho",
        pass: csv.startsWith("tipo;area_m2"),
        info: csv.split("\n")[0],
      });
      res.push({
        name: "CSV linhas >= unidades",
        pass: csv.split("\n").length >= EMPREENDIMENTOS[0].unidades.length + 1,
      });
    } catch {
      res.push({ name: "CSV geração", pass: false });
    }
    try {
      const a = uid();
      const b = uid();
      res.push({
        name: "uid gera valores diferentes",
        pass: a !== b,
        info: `${a} vs ${b}`,
      });
    } catch {
      res.push({ name: "uid", pass: false });
    }
    try {
      const m1 = maxOfSeries([], ["a", "b"]);
      const m2 = maxOfSeries([{ a: 10, b: 20 }], ["a", "b"]);
      const m3 = maxOfSeries([{ a: -5, b: -2 }], ["a", "b"]);
      res.push({ name: "maxOfSeries vazio = 1", pass: m1 === 1 });
      res.push({ name: "maxOfSeries correto no dataset", pass: m2 === 20 });
      res.push({ name: "maxOfSeries com negativos = 1", pass: m3 === 1 });
    } catch {
      res.push({ name: "maxOfSeries", pass: false });
    }
    try {
      const key = LS_SIMS;
      const backup = localStorage.getItem(key);
      const before = (backup ? JSON.parse(backup) : []).length;
      const sim = {
        id: uid(),
        title: "Teste",
        empreendimento: EMPREENDIMENTOS[0].slug,
        unidadeId: EMPREENDIMENTOS[0].unidades[0].id,
        entradaPct: 0.2,
        saldoPct: 0.2,
        parcelas: 12,
        createdAt: Date.now(),
      };
      const arr = backup ? JSON.parse(backup) : [];
      arr.push(sim);
      localStorage.setItem(key, JSON.stringify(arr));
      const after = JSON.parse(localStorage.getItem(key) || "[]").length;
      if (backup === null) localStorage.removeItem(key);
      else localStorage.setItem(key, backup);
      res.push({
        name: "Salvar sim não falha e incrementa",
        pass: after === before + 1,
      });
    } catch {
      res.push({ name: "Salvar sim", pass: false });
    }
    try {
      const e = EMPREENDIMENTOS[0];
      const u = resolveUnidade(e, "id_inexistente");
      res.push({
        name: "resolveUnidade fallback para primeira",
        pass: !!u && u.id === e.unidades[0].id,
      });
      const empty = {
        slug: "vazio",
        nome: "Vazio",
        bairro: "-",
        cidade: "-",
        unidades: [],
      };
      const nu = resolveUnidade(empty, "qualquer");
      res.push({
        name: "resolveUnidade retorna null quando não há unidades",
        pass: nu === null,
      });
    } catch {
      res.push({ name: "resolveUnidade casos", pass: false });
    }

    return res;
  });

  return (
    <div className="mt-6 text-xs">
      <SectionTitle>Testes (smoke)</SectionTitle>
      <ul className="list-disc pl-5">
        {results.map((r, i) => (
          <li key={i} className={r.pass ? "text-emerald-700" : "text-rose-700"}>
            {r.pass ? "PASS" : "FAIL"} — {r.name} {r.info ? `(${r.info})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function App() {
  const [tab, setTab] = useState("corretor");
  const [clienteSlug, setClienteSlug] = useState(EMPREENDIMENTOS[0].slug);

  const openCliente = (slug) => {
    setClienteSlug(slug);
    setTab("cliente");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-black" />
            <div>
              <div className="text-sm text-gray-500">MVP Wireframe</div>
              <div className="font-semibold">Simulador Imobiliário</div>
            </div>
          </div>
          <div>
            <TabButton
              active={tab === "corretor"}
              onClick={() => setTab("corretor")}
            >
              Corretor (Admin)
            </TabButton>
            <TabButton
              active={tab === "cliente"}
              onClick={() => setTab("cliente")}
            >
              Cliente (Simulador)
            </TabButton>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === "corretor" ? (
          <>
            <CorretorAdmin onOpenCliente={openCliente} />
            <Tests />
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Empreendimento:</label>
              <select
                className="border rounded-xl px-3 py-2"
                value={clienteSlug}
                onChange={(e) => setClienteSlug(e.target.value)}
              >
                {EMPREENDIMENTOS.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>
            <ClienteSimulador slug={clienteSlug} />
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-10 text-xs text-gray-500">
        <p>
          Wireframe interativo para validar UX/fluxo. Substitua os mocks por
          integrações reais com <code>/api/ingest</code> (Make) e armazenamento
          em banco.
        </p>
      </footer>
    </div>
  );
}
