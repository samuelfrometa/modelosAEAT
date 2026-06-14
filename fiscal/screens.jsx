// screens.jsx — Dashboard, Subida (dropzone), Procesado IA

const fmtModelColor = {}; // placeholder for future per-model accents

// ============ DASHBOARD ============
function Dashboard({ onNew, onOpen }) {
  const [q, setQ] = React.useState("");
  const docs = DOCUMENTS.filter(d => (d.name + d.concept).toLowerCase().includes(q.toLowerCase()));
  const pend = DOCUMENTS.filter(d => d.status === "revision" || d.status === "borrador").length;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow"><Icon name="grid" size={13} stroke={2.4} />Panel</div>
          <h1 className="title">Tus declaraciones</h1>
          <p className="subtitle">Sube un modelo de Hacienda y deja que la IA lo transcriba y rellene las casillas. Tú revisas y presentas.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={onNew}>Nuevo documento</Button>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-k"><Icon name="fileText" size={15} />Documentos este trimestre</div>
          <div className="stat-v">12</div>
        </div>
        <div className="stat">
          <div className="stat-k"><Icon name="clock" size={15} />Pendientes de revisión</div>
          <div className="stat-v">{pend}</div>
        </div>
        <div className="stat">
          <div className="stat-k"><Icon name="sparkles" size={15} />Casillas rellenadas por IA</div>
          <div className="stat-v">312</div>
        </div>
        <div className="stat">
          <div className="stat-k"><Icon name="clock" size={15} />Tiempo ahorrado estimado</div>
          <div className="stat-v">9,5<small>h</small></div>
        </div>
      </div>

      <div className="toolbar">
        <div className="searchbox">
          <Icon name="search" size={17} />
          <input placeholder="Buscar por modelo, concepto o periodo…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Button variant="secondary" size="md" icon="grid">Todos los modelos</Button>
      </div>

      <div className="doc-list">
        <div className="card">
          {docs.map(d => {
            const st = STATUS_META[d.status];
            return (
              <button key={d.id} className="doc-row" onClick={() => onOpen(d)}>
                <div className="doc-ico"><b>{d.model}</b></div>
                <div>
                  <div className="doc-name">{d.name}</div>
                  <div className="doc-meta">{d.concept} · Actualizado {d.date}</div>
                </div>
                <div className="doc-col hide-sm doc-prog">
                  <div className="bar"><i style={{ width: `${Math.round(d.filled / d.fields * 100)}%` }} /></div>
                  <span><b>{d.filled}</b>/{d.fields}</span>
                </div>
                <div className="doc-col hide-sm">
                  {d.flagged > 0
                    ? <Badge tone="danger" icon="alert">{d.flagged} a revisar</Badge>
                    : <Badge tone={st.tone}>{st.label}</Badge>}
                </div>
                <Icon name="chevronRight" size={18} className="chev" />
              </button>
            );
          })}
          {docs.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-3)" }}>Sin resultados para “{q}”.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ SUBIDA (dropzone) ============
function UploadScreen({ file, onFile, onNext }) {
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef(null);

  const pick = () => {
    // prototipo: simula la selección de un PDF de ejemplo
    onFile({ name: "modelo-303-2T.pdf", size: "2,4 MB", pages: 3 });
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="page-head" style={{ justifyContent: "center", textAlign: "center", marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ justifyContent: "center" }}><Icon name="upload" size={13} stroke={2.4} />Paso 1 · Subir</div>
          <h1 className="title">Sube el modelo a rellenar</h1>
          <p className="subtitle" style={{ margin: "9px auto 0" }}>Arrastra el PDF del modelo de Hacienda. La IA lo convertirá a Markdown y extraerá cada casilla.</p>
        </div>
      </div>

      {!file ? (
        <div
          className={"dropzone" + (drag ? " drag" : "")}
          onClick={pick}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); pick(); }}
        >
          <div className="dz-ico"><Icon name="upload" size={30} /></div>
          <div className="dz-title">Arrastra tu documento aquí</div>
          <div className="dz-sub">o haz clic para seleccionarlo desde tu equipo</div>
          <div className="dz-formats">
            <span className="chip">.pdf</span>
            <span className="chip">.docx</span>
            <span className="chip">.jpg / .png</span>
            <span className="chip">hasta 25 MB</span>
          </div>
          <input ref={inputRef} type="file" hidden />
        </div>
      ) : (
        <div>
          <div className="filecard">
            <div className="doc-ico"><Icon name="file" size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="doc-name">{file.name}</div>
              <div className="doc-meta">{file.size} · {file.pages} páginas · PDF</div>
            </div>
            <Badge tone="ok" icon="check">Listo para procesar</Badge>
            <Button variant="ghost" size="sm" icon="trash" onClick={() => onFile(null)} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
            <Button variant="primary" iconRight="sparkles" onClick={onNext}>Procesar con IA</Button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", marginTop: 26, color: "var(--ink-3)", fontSize: 12.5 }}>
        <Icon name="shield" size={15} />
        <span>Tus documentos se cifran y no se usan para entrenar modelos.</span>
      </div>
    </div>
  );
}

// ============ PROCESADO IA ============
function ProcessingScreen({ onDone }) {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    if (step >= PIPELINE.length) { const t = setTimeout(onDone, 650); return () => clearTimeout(t); }
    const t = setTimeout(() => setStep(s => s + 1), step === 0 ? 900 : 1050);
    return () => clearTimeout(t);
  }, [step]);

  const pct = Math.min(100, Math.round((step / PIPELINE.length) * 100));

  return (
    <div className="proc-wrap">
      <div style={{ textAlign: "center" }}>
        <div className="proc-ai"><Icon name="sparkles" size={32} /></div>
        <div className="eyebrow" style={{ justifyContent: "center" }}><Icon name="sparkles" size={13} stroke={2.4} />Paso 2 · Procesando</div>
        <h1 className="title">La IA está leyendo tu documento</h1>
        <p className="subtitle" style={{ margin: "9px auto 0" }}>Normalmente tarda unos segundos. No cierres esta ventana.</p>
      </div>

      <div className="pipe">
        {PIPELINE.map((p, i) => {
          const state = i < step ? "done" : i === step ? "active" : "";
          return (
            <div key={p.id} className={"pipe-row " + state}>
              <div className="pipe-ico">
                {i < step ? <Icon name="check" size={16} stroke={2.6} />
                  : i === step ? <Icon name="refresh" size={15} className="spin" />
                    : <Icon name="dot" size={9} stroke={0} style={{ fill: "currentColor" }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div className="pipe-label">{p.label}</div>
                {state && <div className="pipe-detail">{p.detail}</div>}
              </div>
              {i === step && <span className="empty-note">en curso…</span>}
            </div>
          );
        })}
      </div>

      <div className="proc-bar"><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

Object.assign(window, { Dashboard, UploadScreen, ProcessingScreen });
