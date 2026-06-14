// review.jsx — Revisión/edición de casillas + vista Markdown + estado final

// --- mini render de Markdown (líneas con color) ---
function renderMD(src) {
  return src.split("\n").map((line, i) => {
    let cls = "";
    if (line.startsWith("# ")) cls = "h1";
    else if (line.startsWith("## ")) cls = "h2";
    else if (line.startsWith(">")) cls = "q";
    const html = line.replace(/\*\*(.+?)\*\*/g, '<span class="b">$1</span>')
      .replace(/`(.+?)`/g, '<span class="b">$1</span>');
    return <div key={i} className={cls} dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }} />;
  });
}

function PaperPreview({ values }) {
  return (
    <div className="docview">
      <div className="paper">
        <h4>Agencia Tributaria — Modelo 303</h4>
        <div className="org">Impuesto sobre el Valor Añadido · Autoliquidación · Ejercicio 2026 · 2T</div>
        <hr />
        {FIELD_GROUPS.map(g => (
          <div key={g.id} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{g.title}</div>
            {g.fields.map(f => (
              <div className="frow" key={f.c + f.label}>
                <span className="lab">{f.c !== "—" && <b style={{ color: "var(--accent-strong)", fontFamily: "var(--mono)", marginRight: 8 }}>{f.c}</b>}{f.label}</span>
                <span className={"val" + (f.conf === "baja" ? " hl" : "")}>{values[f.c + f.label] ?? f.value}{f.unit ? " " + f.unit : ""}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewScreen({ onBack, onConfirm }) {
  const [tab, setTab] = React.useState("pdf");
  const [values, setValues] = React.useState({});
  const [resolved, setResolved] = React.useState({});

  const all = FIELD_GROUPS.flatMap(g => g.fields);
  const aiCount = all.filter(f => f.ai).length;
  const lowCount = all.filter(f => f.conf === "baja" || f.note).filter(f => !resolved[f.c + f.label]).length;

  const setVal = (key, v) => setValues(s => ({ ...s, [key]: v }));

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow"><Icon name="pencil" size={13} stroke={2.4} />Paso 3 · Revisar</div>
          <h1 className="title">Revisa las casillas</h1>
          <p className="subtitle">La IA rellenó <b style={{ color: "var(--ink)" }}>{aiCount} casillas</b> a partir de tu PDF. Confirma los importes o corrígelos antes de presentar.</p>
        </div>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <Badge tone="accent" icon="sparkles">{aiCount} por IA</Badge>
          {lowCount > 0 ? <Badge tone="danger" icon="alert">{lowCount} a verificar</Badge> : <Badge tone="ok" icon="check">Todo verificado</Badge>}
        </div>
      </div>

      <div className="review-grid">
        {/* Panel izquierdo: documento / markdown */}
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title"><Icon name="file" size={16} />modelo-303-2T.pdf</div>
            <div className="tabs">
              <button className={tab === "pdf" ? "on" : ""} onClick={() => setTab("pdf")}><Icon name="eye" size={13} />PDF original</button>
              <button className={tab === "md" ? "on" : ""} onClick={() => setTab("md")}><Icon name="code" size={13} />Markdown</button>
            </div>
          </div>
          <div className="panel-body">
            {tab === "pdf"
              ? <PaperPreview values={values} />
              : <div className="md">{renderMD(GENERATED_MD)}</div>}
          </div>
        </div>

        {/* Panel derecho: casillas editables */}
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title"><Icon name="grid" size={16} />Casillas extraídas</div>
            <span className="empty-note">{all.length} campos</span>
          </div>
          <div className="panel-body">
            {FIELD_GROUPS.map(g => (
              <div className="fgroup" key={g.id}>
                <div className="fgroup-h">{g.title}</div>
                {g.fields.map(f => {
                  const key = f.c + f.label;
                  const flagged = (f.conf === "baja" || f.note) && !resolved[key];
                  const isNum = !!f.unit;
                  return (
                    <div className={"field" + (flagged ? " flagged" : "")} key={key}>
                      <div className={"casilla" + (f.c === "—" ? " none" : "")}>{f.c === "—" ? "·" : f.c}</div>
                      <div className="field-main">
                        <div className="flabel">
                          {f.label}
                          {f.ai && <span className="ai-tag"><Icon name="sparkles" size={11} stroke={2.4} />IA</span>}
                          <ConfBadge conf={resolved[key] ? "alta" : f.conf} />
                        </div>
                        <div className={"input" + (isNum ? " num" : "")}>
                          <input
                            value={values[key] ?? f.value}
                            onChange={e => setVal(key, e.target.value)}
                            onFocus={() => flagged && setResolved(s => ({ ...s, [key]: true }))}
                          />
                          {f.unit && <span className="unit">{f.unit}</span>}
                        </div>
                        {flagged && f.note && (
                          <div className="field-note"><Icon name="alert" size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>{f.note}</span></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="review-foot">
        <Button variant="ghost" icon="chevronLeft" onClick={onBack}>Volver</Button>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {lowCount > 0 && <span className="empty-note" style={{ color: "var(--warn)" }}>{lowCount} casilla(s) por confirmar</span>}
          <Button variant="secondary" icon="download">Exportar .md</Button>
          <Button variant="primary" iconRight="check" onClick={onConfirm}>Confirmar y guardar</Button>
        </div>
      </div>
    </div>
  );
}

// ============ ESTADO FINAL ============
function DoneScreen({ onDashboard, onNew }) {
  return (
    <div className="done-wrap">
      <div className="done-ico"><Icon name="checkCircle" size={40} /></div>
      <div className="eyebrow" style={{ justifyContent: "center" }}><Icon name="check" size={13} stroke={2.4} />Paso 4 · Listo</div>
      <h1 className="title">Modelo 303 guardado</h1>
      <p className="subtitle" style={{ margin: "9px auto 0" }}>Tu autoliquidación está lista para descargar o presentar. La hemos añadido a tu panel.</p>

      <div className="panel done-card">
        <div className="done-row">
          <span style={{ display: "flex", gap: 11, alignItems: "center" }}><span className="doc-ico" style={{ width: 38, height: 38 }}><b>303</b></span><div><div className="doc-name">Modelo 303 · 2T 2026</div><div className="doc-meta">IVA · Autoliquidación</div></div></span>
          <Badge tone="ok" icon="check">Verificado</Badge>
        </div>
        <div className="done-row">
          <span className="doc-col">Resultado de la autoliquidación</span>
          <b style={{ fontFamily: "var(--mono)", fontSize: 16 }}>9.527,40 €</b>
        </div>
        <div className="done-row">
          <span className="doc-col">Formatos disponibles</span>
          <span style={{ display: "flex", gap: 7 }}><span className="chip">.pdf</span><span className="chip">.md</span><span className="chip">.csv</span></span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 11, justifyContent: "center", marginTop: 24 }}>
        <Button variant="secondary" icon="grid" onClick={onDashboard}>Ir al panel</Button>
        <Button variant="primary" icon="download">Descargar</Button>
      </div>
      <button className="navlink" style={{ margin: "18px auto 0" }} onClick={onNew}>Procesar otro documento</button>
    </div>
  );
}

Object.assign(window, { ReviewScreen, DoneScreen });
