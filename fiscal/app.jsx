// app.jsx — ensamblaje: shell, navegación, wizard, variantes y tweaks

const VARIANTS = [
  { id: "sereno", label: "Sereno" },
  { id: "calido", label: "Cálido" },
  { id: "estructurado", label: "Estructurado" },
];

const ACCENTS = {
  "Naranja quemado": ["#e8590c", "#c2410c", "#fdf0e6", "#f6d6bd"],
  "Naranja vivo": ["#f97316", "#ea580c", "#fef0e4", "#fad7b8"],
  "Terracota": ["#d4521f", "#ab3e16", "#fbede4", "#f2cdb6"],
  "Ámbar": ["#e07a0c", "#bb5e08", "#fdf2e0", "#f6dcae"],
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["#e8590c", "#c2410c", "#fdf0e6", "#f6d6bd"],
  "density": "regular"
}/*EDITMODE-END*/;

const STEPS = [
  { id: "upload", label: "Subir" },
  { id: "processing", label: "Procesar" },
  { id: "review", label: "Revisar" },
  { id: "done", label: "Listo" },
];

function Stepper({ current }) {
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          {i > 0 && <div className={"step-line" + (i <= current ? " filled" : "")} />}
          <div className={"step" + (i === current ? " active" : i < current ? " done" : "")}>
            <div className="step-dot">{i < current ? <Icon name="check" size={15} stroke={2.6} /> : i + 1}</div>
            <div className="step-label">{s.label}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [variant, setVariant] = React.useState("sereno");
  const [view, setView] = React.useState("dashboard"); // dashboard | wizard
  const [step, setStep] = React.useState(0);
  const [file, setFile] = React.useState(null);

  const startWizard = () => { setFile(null); setStep(0); setView("wizard"); };
  const goDashboard = () => setView("dashboard");

  const accent = t.accent || ACCENTS["Naranja quemado"];
  const rootStyle = {
    "--accent": accent[0], "--accent-strong": accent[1],
    "--accent-soft": accent[2], "--accent-line": accent[3],
  };

  return (
    <div className="app" data-variant={variant} data-density={t.density === "compact" ? "compact" : "regular"} style={rootStyle}>
      <header className="appbar">
        <div className="appbar-inner">
          <button className="navlink" style={{ padding: 0, background: "none" }} onClick={goDashboard}><Logo /></button>
          <nav className="appbar-nav">
            <button className={"navlink" + (view === "dashboard" ? " active" : "")} onClick={goDashboard}><Icon name="grid" size={16} />Panel</button>
            <button className={"navlink" + (view === "wizard" ? " active" : "")} onClick={startWizard}><Icon name="upload" size={16} />Subir</button>
            <button className="navlink"><Icon name="fileText" size={16} />Modelos</button>
          </nav>
          <div className="appbar-spacer" />
          <div className="seg" title="Variante visual">
            <span className="seg-label">Estilo</span>
            {VARIANTS.map(v => (
              <button key={v.id} className={variant === v.id ? "on" : ""} onClick={() => setVariant(v.id)}>{v.label}</button>
            ))}
          </div>
          <div className="avatar">MR</div>
        </div>
      </header>

      <main className="main">
        {view === "dashboard" && <Dashboard onNew={startWizard} onOpen={() => { setStep(2); setView("wizard"); }} />}

        {view === "wizard" && (
          <div>
            {step < 3 && (
              <div className="wizard-head">
                <Stepper current={step} />
                <Button variant="ghost" size="sm" icon="x" onClick={goDashboard}>Salir</Button>
              </div>
            )}
            {step === 0 && <UploadScreen file={file} onFile={setFile} onNext={() => setStep(1)} />}
            {step === 1 && <ProcessingScreen onDone={() => setStep(2)} />}
            {step === 2 && <ReviewScreen onBack={() => setStep(0)} onConfirm={() => setStep(3)} />}
            {step === 3 && <DoneScreen onDashboard={goDashboard} onNew={startWizard} />}
          </div>
        )}
      </main>

      <TweaksPanel>
        <TweakSection label="Color de acento" />
        <TweakColor
          label="Naranja"
          value={t.accent}
          options={Object.values(ACCENTS)}
          onChange={v => setTweak("accent", v)}
        />
        <TweakSection label="Densidad" />
        <TweakRadio
          label="Espaciado"
          value={t.density}
          options={["regular", "compact"]}
          onChange={v => setTweak("density", v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
