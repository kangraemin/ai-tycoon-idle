// main.js - App initialization + game loop

const AUTO_SAVE_INTERVAL = 30000;

let _goalsStructureKey = '';
let _missionKey = '';
let lastUnlock80Check = 0;

function getCurrentMission() {
  const st = gameState;
  const owned = typeof getOwnedModels === 'function' ? getOwnedModels().length : 0;
  const maxSlots = typeof getEffectiveGpuSlots === 'function' ? getEffectiveGpuSlots() : st.gpuSlots;

  if (!st.stats || (st.stats.totalTaps < 10 && st.compute < 30 && st.loc < 30))
    return { id: 'tap', icon: 'keyboard', title: 'Write some Code!', sub: 'Tap the editor to start', screen: null, hasProg: false };

  if (st.loc >= 10 && st.compute < 50)
    return { id: 'compile', icon: 'memory', title: 'Compile your Code!', sub: 'Turn LoC into Compute', screen: null, hasProg: true, getCurrent: () => st.compute, required: 50 };

  if (st.compute >= 50 && st.upgrades.infra.batchSize === 0)
    return { id: 'batch', icon: 'data_array', title: 'Buy Batch Size upgrade!', sub: 'More Code per tap', screen: 'upgrade', hasProg: true, getCurrent: () => st.compute, required: typeof getUpgradeCost === 'function' ? getUpgradeCost('infra', 'batchSize') : 50 };

  if (st.stats && st.stats.totalCompiles >= 2 && st.editorTab !== 'train' && st.papers < 50)
    return { id: 'train', icon: 'model_training', title: 'Switch to train.js tab!', sub: 'Compile there to earn Papers', screen: null, hasProg: false };

  if (st.papers >= 10 && owned < maxSlots)
    return { id: 'research', icon: 'science', title: 'Research a new AI model!', sub: st.papers + ' Papers ready', screen: 'research', hasProg: false };

  if (owned >= maxSlots && typeof getGpuSlotCost === 'function' && st.compute >= getGpuSlotCost())
    return { id: 'gpu', icon: 'developer_board', title: 'Expand GPU slots!', sub: 'Fit more models', screen: 'upgrade', hasProg: true, getCurrent: () => st.compute, required: getGpuSlotCost() };

  const nextModel = Object.entries(MODEL_DEFS)
    .filter(([id, def]) => def.unlockCost > 0 && getModelState(id)?.count === 0)
    .sort((a, b) => a[1].unlockCost - b[1].unlockCost)[0];
  if (nextModel) {
    const [id, def] = nextModel;
    return { id: 'unlock-' + id, icon: 'smart_toy', title: 'Unlock ' + def.name + '!', sub: (typeof formatNumber === 'function' ? formatNumber(def.unlockCost) : def.unlockCost) + ' Compute needed', screen: 'models', hasProg: true, getCurrent: () => st.compute, required: def.unlockCost };
  }

  if (typeof canPromote === 'function' && canPromote())
    return { id: 'promote', icon: 'workspace_premium', title: 'Advance your career!', sub: 'Get 2x production multiplier', screen: 'career', hasProg: false };

  return null;
}

function renderMissionCard() {
  const card = document.getElementById('mission-card');
  if (!card) return;
  const m = getCurrentMission();
  if (!m) { card.style.display = 'none'; _missionKey = ''; return; }
  _missionKey = m.id;
  card.style.display = '';
  const pct = m.hasProg ? Math.min(100, Math.floor(m.getCurrent() / m.required * 100)) : 0;
  let inner = '<div class="mission-inner"' + (m.screen ? ' onclick="switchScreen(\'' + m.screen + '\')" style="cursor:pointer"' : '') + '>';
  inner += '<span class="material-symbols-outlined mission-icon">' + m.icon + '</span>';
  inner += '<div class="mission-info">';
  inner += '<div class="mission-title">' + m.title + '</div>';
  inner += '<div class="mission-sub">' + m.sub + '</div>';
  if (m.hasProg) inner += '<div class="mission-bar"><div class="mission-bar-fill" id="mb-' + m.id + '" style="width:' + pct + '%"></div></div>';
  inner += '</div>';
  if (m.screen) inner += '<span class="material-symbols-outlined mission-arrow">chevron_right</span>';
  inner += '</div>';
  card.innerHTML = inner;
}

function updateMissionCard() {
  const card = document.getElementById('mission-card');
  if (!card) return;
  const m = getCurrentMission();
  if (!m) { if (_missionKey) { card.style.display = 'none'; _missionKey = ''; } return; }
  if (m.id !== _missionKey) { renderMissionCard(); return; }
  if (m.hasProg) {
    const fill = document.getElementById('mb-' + m.id);
    if (fill) fill.style.width = Math.min(100, Math.floor(m.getCurrent() / m.required * 100)) + '%';
  }
}

function getNextGoalItems() {
  const items = [];
  const mission = getCurrentMission();
  const earlyMissionIds = new Set(['tap', 'compile', 'batch', 'train', 'research', 'gpu']);
  const missionIsEarlyPhase = mission && earlyMissionIds.has(mission.id);

  // 1) Career progress first — long-term anchor separate from Mission tactical steps
  const nextCareer = getNextCareer();
  if (nextCareer) {
    items.push({ key: 'career-' + gameState.careerStage, icon: nextCareer.icon,
      label: nextCareer.name, getCurrent: () => gameState.reputation,
      required: nextCareer.repReq, screen: 'career', color: 'var(--reputation)' });
  }

  // 2) GPU slot expansion (only when full)
  if (getOwnedModels().length >= getEffectiveGpuSlots()) {
    items.push({ key: 'gpu', icon: 'developer_board', label: 'GPU Slot',
      getCurrent: () => gameState.compute, required: getGpuSlotCost(),
      screen: 'upgrade', color: 'var(--papers)' });
  }

  // 3) Next model unlock — suppressed during early-phase missions to avoid CTA conflict with Mission card
  if (!missionIsEarlyPhase) {
    const nextModel = Object.entries(MODEL_DEFS)
      .filter(([id, def]) => def.unlockCost > 0 && getModelState(id)?.count === 0)
      .sort((a, b) => a[1].unlockCost - b[1].unlockCost)[0];
    if (nextModel) {
      const [id, def] = nextModel;
      const iconStyle = MODEL_ICON_STYLES[Object.keys(MODEL_DEFS).indexOf(id)] || MODEL_ICON_STYLES[0];
      items.push({ key: 'model-' + id, icon: iconStyle.icon, label: 'Unlock ' + def.name,
        getCurrent: () => gameState.compute, required: def.unlockCost,
        screen: 'models', color: 'var(--accent)' });
    }
  }

  return items;
}

function renderGoalsCard() {
  const card = document.getElementById('goals-card');
  if (!card) return;
  const items = getNextGoalItems();
  if (!items.length) { card.style.display = 'none'; return; }
  card.style.display = '';
  _goalsStructureKey = items.map(i => i.key).join(',');
  const mainItem = items[0];
  const pct = Math.min(100, Math.floor(mainItem.getCurrent() / mainItem.required * 100));
  let html = `<div class="goal-item" onclick="switchScreen('${mainItem.screen}')">
      <span class="material-symbols-outlined goal-icon">${mainItem.icon}</span>
      <div class="goal-info">
        <div class="goal-label">${mainItem.label}</div>
        <div class="goal-bar"><div class="goal-bar-fill" id="gf-${mainItem.key}"
          style="width:${pct}%;background:${mainItem.color}"></div></div>
      </div>
      <span class="goal-pct${pct === 100 ? ' goal-pct-ready' : ''}" id="gp-${mainItem.key}">${pct === 100 ? 'READY!' : pct + '%'}</span>
      <span class="material-symbols-outlined goal-arrow">chevron_right</span>
    </div>`;
  if (items.length > 1) html += `<div class="goal-more">+${items.length - 1} more goals</div>`;
  card.innerHTML = html;
}

function updateGoalsProgress() {
  const card = document.getElementById('goals-card');
  if (!card || card.style.display === 'none') return;
  const items = getNextGoalItems();
  const newKey = items.map(i => i.key).join(',');
  if (newKey !== _goalsStructureKey) { renderGoalsCard(); return; }
  const mainItem = items[0];
  const fill = document.getElementById('gf-' + mainItem.key);
  const pct_el = document.getElementById('gp-' + mainItem.key);
  if (fill && pct_el) {
    const pct = Math.min(100, Math.floor(mainItem.getCurrent() / mainItem.required * 100));
    fill.style.width = pct + '%';
    pct_el.textContent = pct === 100 ? 'READY!' : pct + '%';
    pct_el.classList.toggle('goal-pct-ready', pct === 100);
  }
}

const UPGRADE_ICONS = {
  toolUse:       { icon: 'build',         bg: 'agent-bg',  category: 'agent' },
  memory:        { icon: 'psychology',     bg: 'agent-bg',  category: 'agent' },
  planning:      { icon: 'account_tree',   bg: 'agent-bg',  category: 'agent' },
  multiAgent:    { icon: 'groups',         bg: 'team-bg',   category: 'teamAgent' },
  orchestrator:  { icon: 'hub',            bg: 'team-bg',   category: 'teamAgent' },
  delegation:    { icon: 'share',          bg: 'team-bg',   category: 'teamAgent' },
  rag:           { icon: 'search',         bg: 'skill-bg',  category: 'skill' },
  fineTuning:    { icon: 'tune',           bg: 'skill-bg',  category: 'skill' },
  rlhf:          { icon: 'thumb_up',       bg: 'skill-bg',  category: 'skill' },
  batchSize:     { icon: 'data_array',     bg: 'infra-bg',  category: 'infra' },
  distTraining:  { icon: 'lan',            bg: 'infra-bg',  category: 'infra' },
  quantization:  { icon: 'compress',       bg: 'infra-bg',  category: 'infra' },
  autoPipeline:  { icon: 'conveyor_belt',  bg: 'infra-bg',  category: 'infra' },
};

const MODEL_ICON_STYLES = [
  { bg: 'agent-bg',  icon: 'chat' },         // chatbot
  { bg: 'skill-bg',  icon: 'translate' },     // translator
  { bg: 'team-bg',   icon: 'summarize' },     // summarizer
  { bg: 'agent-bg',  icon: 'image' },         // imageGen
  { bg: 'infra-bg',  icon: 'code' },          // codeGen
  { bg: 'skill-bg',  icon: 'mic' },           // voiceAI
  { bg: 'team-bg',   icon: 'psychology' },    // reasoning
  { bg: 'infra-bg',  icon: 'hub' },           // multimodal
  { bg: 'agent-bg',  icon: 'auto_awesome' },  // agi
  { bg: 'skill-bg',  icon: 'bolt' },          // superAgi
];

// Code snippets for editor display
const CODE_LINES = [
  { text: 'import torch', type: 'keyword' },
  { text: 'from transformers import AutoModel', type: 'keyword' },
  { text: '', type: 'default' },
  { text: 'class AIAgent:', type: 'type' },
  { text: '    def __init__(self, model_name):', type: 'function' },
  { text: '        self.model = AutoModel.from_pretrained(model_name)', type: 'string' },
  { text: '        self.tokenizer = AutoTokenizer.from_pretrained(model_name)', type: 'string' },
  { text: '', type: 'default' },
  { text: '    def generate(self, prompt, max_tokens=512):', type: 'function' },
  { text: '        inputs = self.tokenizer(prompt, return_tensors="pt")', type: 'variable' },
  { text: '        outputs = self.model.generate(**inputs, max_new_tokens=max_tokens)', type: 'variable' },
  { text: '        return self.tokenizer.decode(outputs[0])', type: 'string' },
  { text: '', type: 'default' },
  { text: '    # TODO: Add memory module', type: 'comment' },
  { text: '    def train(self, dataset, epochs=3):', type: 'function' },
  { text: '        for epoch in range(epochs):', type: 'keyword' },
  { text: '            loss = self.compute_loss(dataset)', type: 'function' },
  { text: '            loss.backward()', type: 'function' },
  { text: '            self.optimizer.step()', type: 'function' },
];

const CODE_SNIPPET_SETS = {
  NLP: [
    { text: 'from transformers import pipeline', type: 'keyword' },
    { text: 'from datasets import load_dataset', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class SentimentAnalyzer:', type: 'type' },
    { text: '    def __init__(self):', type: 'function' },
    { text: '        self.pipe = pipeline("sentiment-analysis")', type: 'string' },
    { text: '', type: 'default' },
    { text: '    def analyze(self, texts):', type: 'function' },
    { text: '        results = self.pipe(texts)', type: 'variable' },
    { text: '        return [r["label"] for r in results]', type: 'variable' },
    { text: '', type: 'default' },
    { text: '    # Batch processing for efficiency', type: 'comment' },
    { text: '    def train_classifier(self, dataset):', type: 'function' },
    { text: '        tokenized = self.tokenize(dataset)', type: 'function' },
    { text: '        self.model.train(tokenized)', type: 'function' },
    { text: '        metrics = self.evaluate()', type: 'function' },
    { text: '        return metrics["f1_score"]', type: 'string' },
  ],
  Vision: [
    { text: 'import torch.nn as nn', type: 'keyword' },
    { text: 'from torchvision import models', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class ImageClassifier(nn.Module):', type: 'type' },
    { text: '    def __init__(self, num_classes=10):', type: 'function' },
    { text: '        super().__init__()', type: 'function' },
    { text: '        self.backbone = models.resnet50(pretrained=True)', type: 'string' },
    { text: '', type: 'default' },
    { text: '    def forward(self, x):', type: 'function' },
    { text: '        features = self.backbone(x)', type: 'variable' },
    { text: '        return self.classifier(features)', type: 'variable' },
    { text: '', type: 'default' },
    { text: '    # Fine-tune on custom data', type: 'comment' },
    { text: '    def fit(self, loader, epochs=5):', type: 'function' },
    { text: '        for epoch in range(epochs):', type: 'keyword' },
    { text: '            for batch in loader:', type: 'keyword' },
    { text: '                loss = self.step(batch)', type: 'function' },
  ],
  CodeGen: [
    { text: 'from openai import OpenAI', type: 'keyword' },
    { text: 'import ast', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class CodeAssistant:', type: 'type' },
    { text: '    def __init__(self, model="gpt-4"):', type: 'function' },
    { text: '        self.client = OpenAI()', type: 'variable' },
    { text: '        self.model = model', type: 'variable' },
    { text: '', type: 'default' },
    { text: '    def complete(self, context, lang="python"):', type: 'function' },
    { text: '        resp = self.client.chat.completions.create(', type: 'function' },
    { text: '            model=self.model,', type: 'string' },
    { text: '            messages=[{"role": "user", "content": context}]', type: 'string' },
    { text: '        )', type: 'default' },
    { text: '        code = resp.choices[0].message.content', type: 'variable' },
    { text: '        # Validate generated code', type: 'comment' },
    { text: '        ast.parse(code)', type: 'function' },
    { text: '        return code', type: 'variable' },
  ],
  Translation: [
    { text: 'from transformers import MarianMTModel, MarianTokenizer', type: 'keyword' },
    { text: 'import sentencepiece', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class Translator:', type: 'type' },
    { text: '    def __init__(self, src="en", tgt="ko"):', type: 'function' },
    { text: '        model_name = f"Helsinki-NLP/opus-mt-{src}-{tgt}"', type: 'string' },
    { text: '        self.tokenizer = MarianTokenizer.from_pretrained(model_name)', type: 'variable' },
    { text: '        self.model = MarianMTModel.from_pretrained(model_name)', type: 'variable' },
    { text: '', type: 'default' },
    { text: '    def translate(self, texts):', type: 'function' },
    { text: '        tokens = self.tokenizer(texts, return_tensors="pt", padding=True)', type: 'function' },
    { text: '        output = self.model.generate(**tokens)', type: 'function' },
    { text: '        # Decode translated tokens', type: 'comment' },
    { text: '        return self.tokenizer.batch_decode(output, skip_special_tokens=True)', type: 'function' },
  ],
  Audio: [
    { text: 'import whisper', type: 'keyword' },
    { text: 'import numpy as np', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class SpeechRecognizer:', type: 'type' },
    { text: '    def __init__(self, model_size="base"):', type: 'function' },
    { text: '        self.model = whisper.load_model(model_size)', type: 'string' },
    { text: '        self.sample_rate = 16000', type: 'variable' },
    { text: '', type: 'default' },
    { text: '    def transcribe(self, audio_path):', type: 'function' },
    { text: '        result = self.model.transcribe(audio_path)', type: 'function' },
    { text: '        segments = result["segments"]', type: 'variable' },
    { text: '        # Extract text with timestamps', type: 'comment' },
    { text: '        return [(s["start"], s["text"]) for s in segments]', type: 'variable' },
  ],
  Reasoning: [
    { text: 'from langchain import PromptTemplate, LLMChain', type: 'keyword' },
    { text: 'from langchain.llms import OpenAI', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class ReasoningEngine:', type: 'type' },
    { text: '    def __init__(self, temperature=0.2):', type: 'function' },
    { text: '        self.llm = OpenAI(temperature=temperature)', type: 'string' },
    { text: '        self.steps = []', type: 'variable' },
    { text: '', type: 'default' },
    { text: '    def chain_of_thought(self, question):', type: 'function' },
    { text: '        prompt = PromptTemplate.from_template(', type: 'function' },
    { text: '            "Think step by step: {question}"', type: 'string' },
    { text: '        )', type: 'default' },
    { text: '        chain = LLMChain(llm=self.llm, prompt=prompt)', type: 'variable' },
    { text: '        # Run reasoning chain', type: 'comment' },
    { text: '        return chain.run(question=question)', type: 'function' },
  ],
};

// JavaScript code snippets for train.js tab
const JS_CODE_LINES = [
  { text: 'import { DataLoader } from "./data/loader.js";', type: 'keyword' },
  { text: 'import { Tokenizer } from "./nlp/tokenizer.js";', type: 'keyword' },
  { text: '', type: 'default' },
  { text: 'class TrainingPipeline {', type: 'type' },
  { text: '  constructor(config) {', type: 'function' },
  { text: '    this.batchSize = config.batchSize ?? 32;', type: 'variable' },
  { text: '    this.learningRate = config.lr ?? 0.001;', type: 'variable' },
  { text: '    this.epochs = config.epochs ?? 10;', type: 'variable' },
  { text: '  }', type: 'default' },
  { text: '', type: 'default' },
  { text: '  async loadDataset(path) {', type: 'function' },
  { text: '    const loader = new DataLoader(path);', type: 'variable' },
  { text: '    const raw = await loader.fetch();', type: 'variable' },
  { text: '    // Tokenize and split into batches', type: 'comment' },
  { text: '    return Tokenizer.batchEncode(raw, this.batchSize);', type: 'function' },
  { text: '  }', type: 'default' },
  { text: '', type: 'default' },
  { text: '  async train(dataset) {', type: 'function' },
  { text: '    for (let epoch = 0; epoch < this.epochs; epoch++) {', type: 'keyword' },
  { text: '      const loss = await this.runEpoch(dataset);', type: 'function' },
  { text: '      console.log(`Epoch ${epoch}: loss=${loss.toFixed(4)}`);', type: 'string' },
  { text: '    }', type: 'default' },
  { text: '  }', type: 'default' },
];

const JS_CODE_SNIPPET_SETS = {
  DataLoader: [
    { text: 'const fs = require("node:fs/promises");', type: 'keyword' },
    { text: 'const { Transform } = require("node:stream");', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class DataLoader {', type: 'type' },
    { text: '  constructor(source, options = {}) {', type: 'function' },
    { text: '    this.source = source;', type: 'variable' },
    { text: '    this.chunkSize = options.chunkSize ?? 1024;', type: 'variable' },
    { text: '  }', type: 'default' },
    { text: '', type: 'default' },
    { text: '  async *stream() {', type: 'function' },
    { text: '    const handle = await fs.open(this.source, "r");', type: 'variable' },
    { text: '    // Yield chunks for memory efficiency', type: 'comment' },
    { text: '    for await (const chunk of handle.readableWebStream()) {', type: 'keyword' },
    { text: '      yield this.transform(chunk);', type: 'function' },
    { text: '    }', type: 'default' },
  ],
  Trainer: [
    { text: 'import { Adam } from "./optimizers/adam.js";', type: 'keyword' },
    { text: 'import { Scheduler } from "./lr/scheduler.js";', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class Trainer {', type: 'type' },
    { text: '  constructor(model, config) {', type: 'function' },
    { text: '    this.model = model;', type: 'variable' },
    { text: '    this.optimizer = new Adam(model.parameters(), config.lr);', type: 'variable' },
    { text: '    this.scheduler = new Scheduler("cosine", config.warmupSteps);', type: 'variable' },
    { text: '  }', type: 'default' },
    { text: '', type: 'default' },
    { text: '  async step(batch) {', type: 'function' },
    { text: '    const logits = this.model.forward(batch.input);', type: 'variable' },
    { text: '    const loss = crossEntropy(logits, batch.labels);', type: 'function' },
    { text: '    // Backprop and update weights', type: 'comment' },
    { text: '    loss.backward();', type: 'function' },
    { text: '    this.optimizer.step();', type: 'function' },
  ],
  Optimizer: [
    { text: 'const { Tensor } = require("./core/tensor.js");', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class AdamW {', type: 'type' },
    { text: '  constructor(params, lr = 3e-4, weightDecay = 0.01) {', type: 'function' },
    { text: '    this.params = params;', type: 'variable' },
    { text: '    this.lr = lr;', type: 'variable' },
    { text: '    this.beta1 = 0.9;', type: 'variable' },
    { text: '    this.beta2 = 0.999;', type: 'variable' },
    { text: '    this.weightDecay = weightDecay;', type: 'variable' },
    { text: '  }', type: 'default' },
    { text: '', type: 'default' },
    { text: '  step() {', type: 'function' },
    { text: '    for (const p of this.params) {', type: 'keyword' },
    { text: '      // Apply weight decay before gradient update', type: 'comment' },
    { text: '      p.data.mul_(1 - this.lr * this.weightDecay);', type: 'function' },
    { text: '      p.data.add_(p.grad, -this.lr);', type: 'function' },
    { text: '    }', type: 'default' },
  ],
  Evaluator: [
    { text: 'import { metrics } from "./eval/metrics.js";', type: 'keyword' },
    { text: 'import { Benchmark } from "./eval/benchmark.js";', type: 'keyword' },
    { text: '', type: 'default' },
    { text: 'class ModelEvaluator {', type: 'type' },
    { text: '  constructor(model, testSet) {', type: 'function' },
    { text: '    this.model = model;', type: 'variable' },
    { text: '    this.testSet = testSet;', type: 'variable' },
    { text: '    this.results = [];', type: 'variable' },
    { text: '  }', type: 'default' },
    { text: '', type: 'default' },
    { text: '  async evaluate() {', type: 'function' },
    { text: '    const preds = await this.model.predict(this.testSet);', type: 'variable' },
    { text: '    const accuracy = metrics.accuracy(preds, this.testSet.labels);', type: 'function' },
    { text: '    // Log results with timestamp', type: 'comment' },
    { text: '    this.results.push({ accuracy, timestamp: Date.now() });', type: 'variable' },
    { text: '    return accuracy;', type: 'function' },
  ],
};

function getActiveCodeLines() {
  return gameState.editorTab === 'train' ? JS_CODE_LINES : CODE_LINES;
}
function getActiveSnippetSets() {
  return gameState.editorTab === 'train' ? JS_CODE_SNIPPET_SETS : CODE_SNIPPET_SETS;
}

let gameLoopId = null;
let autoSaveId = null;
let currentCodeLine = 0;
let currentCharIndex = 0;
let autoTypeAccum = 0;
let currentChallengeType = null;
let _lastEditorLine = -1;

// Advance typing by N characters in the editor
function advanceTyping(chars) {
  const lines = getActiveCodeLines();
  const line = lines[currentCodeLine];
  if (!line) return;

  const fullText = line.text;
  currentCharIndex += chars;

  // Move to next line(s) if current line is complete
  while (currentCharIndex >= lines[currentCodeLine].text.length) {
    const overflow = currentCharIndex - lines[currentCodeLine].text.length;
    currentCodeLine = (currentCodeLine + 1) % lines.length;
    currentCharIndex = 0;

    // If we wrapped around, swap snippet & reset display
    if (currentCodeLine === 0) {
      const snippetSets = getActiveSnippetSets();
      const available = Object.keys(snippetSets);
      const currentTheme = available.find(t =>
        snippetSets[t][0]?.text === lines[0]?.text
      );
      const others = available.filter(t => t !== currentTheme);
      const pick = others.length > 0
        ? others[Math.floor(Math.random() * others.length)]
        : available[Math.floor(Math.random() * available.length)];
      const newLines = snippetSets[pick];
      if (newLines) {
        lines.length = 0;
        newLines.forEach(l => lines.push(l));
      }
      renderEditorScreen();
      return;
    }

    // Skip empty lines automatically
    if (lines[currentCodeLine].text.length === 0) {
      updateEditorLine(currentCodeLine - 1, true);
      currentCharIndex = 0;
      continue;
    }

    currentCharIndex = Math.min(overflow, lines[currentCodeLine].text.length);
  }

  updateEditorDOM();
}

// Update only the changed parts of the editor DOM (no full re-render)
function updateEditorDOM() {
  const codeContent = document.querySelector('.code-content');
  const lineNumbers = document.querySelector('.line-numbers');
  if (!codeContent || !lineNumbers) return;

  const codeLines = codeContent.querySelectorAll('.code-line');
  const lineNums = lineNumbers.querySelectorAll('.line-number');

  const prevLine = _lastEditorLine;

  codeLines.forEach((el, i) => {
    const isActive = i === currentCodeLine;

    if (i === currentCodeLine || i === prevLine) {
      el.classList.toggle('active-line', isActive);
      el.classList.toggle('typing', isActive);
      if (lineNums[i]) lineNums[i].classList.toggle('active', isActive);
    }

    if (isActive) {
      const line = getActiveCodeLines()[i];
      const visibleText = line.text.substring(0, currentCharIndex);
      el.innerHTML = `<span class="code-${line.type}">${escapeHtml(visibleText)}</span><span class="editor-cursor"></span>`;
    } else if (i === prevLine && prevLine !== currentCodeLine) {
      const line = getActiveCodeLines()[i];
      el.innerHTML = `<span class="code-${line.type}">${escapeHtml(line.text)}</span>`;
    }
  });

  _lastEditorLine = currentCodeLine;

  // Update status bar line number
  const statusRight = document.querySelector('.editor-status-right .editor-status-item');
  if (statusRight) statusRight.textContent = `Ln ${currentCodeLine + 1}`;

  // Auto-scroll only on line change
  if (prevLine !== currentCodeLine) {
    const editorBody = document.querySelector('.editor-body');
    const activeLine = codeContent.querySelector('.code-line.active-line');
    if (editorBody && activeLine) {
      const bodyRect = editorBody.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();
      if (lineRect.bottom > bodyRect.bottom || lineRect.top < bodyRect.top) {
        activeLine.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }
}

function updateEditorLine(lineIndex, completed) {
  const codeContent = document.querySelector('.code-content');
  if (!codeContent) return;
  const codeLines = codeContent.querySelectorAll('.code-line');
  if (codeLines[lineIndex]) {
    const line = getActiveCodeLines()[lineIndex];
    codeLines[lineIndex].innerHTML = `<span class="code-${line.type}">${escapeHtml(line.text)}</span>`;
    codeLines[lineIndex].classList.remove('active-line', 'typing');
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tokenTick() {
  const now = Date.now();
  const elapsed = now - gameState.lastTokenRecharge;
  const rechargeInterval = 5 * 60 * 1000;

  if (gameState.tokens >= 10) {
    gameState.lastTokenRecharge = now;
    const tokensEl = document.getElementById('tokens-display');
    if (tokensEl) tokensEl.textContent = '10/10';
    return;
  }

  if (elapsed >= rechargeInterval) {
    const recharges = Math.floor(elapsed / rechargeInterval);
    gameState.tokens = Math.min(10, gameState.tokens + recharges);
    gameState.lastTokenRecharge = now - (elapsed % rechargeInterval);
  }

  const tokensEl = document.getElementById('tokens-display');
  if (tokensEl) {
    const remaining = Math.max(0, rechargeInterval - elapsed);
    const min = Math.floor(remaining / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);
    tokensEl.textContent = gameState.tokens + '/10 (' + min + ':' + (sec < 10 ? '0' : '') + sec + ')';
  }
}

function gameLoop() {
  const now = performance.now();
  if (lastTickTime === 0) lastTickTime = now;
  const dt = (now - lastTickTime) / 1000;
  lastTickTime = now;

  if (dt > 0 && dt < 10) {
    produceTick(dt);
    autoCompileTick(dt);
    if (typeof tokenTick === 'function') tokenTick();
    if (typeof eventTick === 'function') eventTick(dt);
    if (typeof cleanupExpiredBuffs === 'function') cleanupExpiredBuffs();

    // Auto-typing: advance characters based on LPS
    const lps = getLocPerSecond();
    if (lps > 0) {
      autoTypeAccum += lps * dt * 0.5; // 0.5 chars per LoC for readable speed
      const chars = Math.floor(autoTypeAccum);
      if (chars > 0) {
        autoTypeAccum -= chars;
        advanceTyping(Math.min(chars, 3)); // Cap at 3 chars per tick for readability
      }
    }
  } else {
    lastTickTime = now;
  }
  updateCurrencyDisplay();
  if (currentScreen === 'upgrade' && typeof updateUpgradeButtonStates === 'function') updateUpgradeButtonStates();
  updateChallengeCooldownDisplay();
  if (typeof updateHintBanner === 'function') updateHintBanner();
  if (typeof updateMissionCard === 'function') updateMissionCard();
  if (typeof updateGoalsProgress === 'function') updateGoalsProgress();
  if (typeof renderEventBanner === 'function') renderEventBanner();
  if (typeof checkAchievements === 'function') checkAchievements();
  if (typeof checkTabUnlock === 'function') checkTabUnlock();

  if (now - lastUnlock80Check > 5000) {
    lastUnlock80Check = now;
    for (const model of gameState.models) {
      if (model.count > 0) continue;
      const def = typeof MODEL_DEFS !== 'undefined' ? MODEL_DEFS[model.id] : null;
      if (!def || !def.unlockCost) continue;
      const pct = gameState.compute / def.unlockCost * 100;
      const key = 'unlock80-' + model.id;
      if (pct >= 80 && pct < 100 && !gameState.shownUnlockModals.includes(key)) {
        gameState.shownUnlockModals.push(key);
        if (typeof showToast === 'function') showToast('Almost there! ' + def.name + ' is within reach!', 'info');
      }
    }
  }
}

async function startGame() {
  const loaded = await loadGame();

  initUI();

  // Unlock tabs for returning players
  if (loaded && typeof checkTabUnlock === 'function') {
    lastTabUnlockCheck = 0; // force check
    checkTabUnlock();
  }

  renderEditorScreen();
  renderModelsScreen();
  renderUpgradeScreen();
  renderResearchScreen();
  renderFusionScreen();
  renderCareerScreen();
  updateCurrencyDisplay();

  if (loaded) {
    applyOfflineEarnings();
  }
  gameState._sessionStartTime = Date.now();
  Analytics.sessionStart(loaded);

  if (gameState.tutorialStep < (typeof TUTORIAL_STEPS !== 'undefined' ? TUTORIAL_STEPS.length : 6)) {
    startTutorial();
  }

  if (typeof checkDailyBonus === 'function') checkDailyBonus();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Skip if modal or challenge is active
    if (document.getElementById('modal-overlay')?.classList.contains('active')) return;
    if (document.getElementById('challenge-overlay')?.style.display !== 'none') return;

    if (e.code === 'Enter') {
      e.preventDefault();
      compileData();
    }
  });

  lastTickTime = performance.now();
  if (gameLoopId) clearInterval(gameLoopId);
  if (autoSaveId) clearInterval(autoSaveId);
  gameLoopId = setInterval(gameLoop, 100);
  autoSaveId = setInterval(saveGame, AUTO_SAVE_INTERVAL);
  if (typeof AdMobManager !== 'undefined') AdMobManager.init();

  window.addEventListener('beforeunload', () => Analytics.sessionEnd(gameState));

  // Apply saved volume settings
  if (typeof SFX !== 'undefined' && SFX._setVolume && gameState.settings?.sfxVolume !== undefined) {
    SFX._setVolume(gameState.settings.sfxVolume);
  }
  if (typeof BGM !== 'undefined') {
    if (gameState.settings?.musicVolume !== undefined) BGM.setVolume(gameState.settings.musicVolume);
    BGM.initOnInteraction();
  }
}

function updateGpuSlotCount() {
  const owned = getOwnedModels();
  const el = document.getElementById('gpu-slot-count');
  if (el) el.textContent = `${owned.length}/${gameState.gpuSlots} GPU`;
  const modelEl = document.getElementById('model-slot-count');
  if (modelEl) modelEl.textContent = `${owned.length}/${gameState.gpuSlots} GPU`;
}

function updateChallengeCooldownDisplay() {
  if (typeof getChallengeCooldown !== 'function') return;
  const cooldown = getChallengeCooldown();
  const btn = document.querySelector('.editor-challenge-area .btn');
  if (!btn) return;
  if (cooldown > 0) {
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle">hourglass_top</span> ' + Math.ceil(cooldown / 1000) + 's';
    btn.classList.add('btn-disabled');
    btn.classList.remove('btn-primary');
    btn.disabled = true;
  } else if (btn.classList.contains('btn-disabled') && btn.textContent.includes('s')) {
    renderEditorScreen();
  }
}

function renderEditorScreen() {
  const container = document.getElementById('editor-content');
  if (!container) return;

  let html = '<div id="mission-card" class="mission-card"></div><div id="goals-card" class="goals-card"></div><div class="code-editor">';
  html += '<div class="editor-tab-bar">';
  const isAgentActive = gameState.editorTab !== 'train';
  html += '<div class="editor-tab ' + (isAgentActive ? 'active' : '') + '" onclick="switchEditorTab(\'agent\')"><span class="editor-tab-icon">PY</span> agent.py</div>';
  html += '<div class="editor-tab ' + (!isAgentActive ? 'active' : '') + '" onclick="switchEditorTab(\'train\')"><span class="editor-tab-icon">JS</span> train.js</div>';
  html += '</div>';
  html += '<div class="editor-body" onclick="tapEditor(event)">';
  const showTapPrompt = typeof isTutorialActive === 'function' && isTutorialActive()
    && typeof gameState !== 'undefined' && gameState.tutorialStep === 1;
  if (showTapPrompt) {
    html += '<div class="tap-prompt">'
      + '<span class="material-symbols-outlined tap-prompt-icon">touch_app</span>'
      + '<span class="tap-prompt-label">Tap to Code</span>'
      + '</div>';
  }
  html += '<div class="line-numbers">';
  const activeLines = getActiveCodeLines();
  activeLines.forEach((_, i) => {
    html += `<div class="line-number ${i === currentCodeLine ? 'active' : ''}">${i + 1}</div>`;
  });
  html += '</div>';
  html += '<div class="code-content">';
  activeLines.forEach((line, i) => {
    const isActive = i === currentCodeLine;
    const isPast = i < currentCodeLine;
    const activeClass = isActive ? ' active-line typing' : '';
    const dimClass = !isPast && !isActive ? ' code-line-future' : '';

    if (isActive) {
      const visibleText = line.text.substring(0, currentCharIndex);
      html += `<div class="code-line${activeClass}"><span class="code-${line.type}">${escapeHtml(visibleText)}</span><span class="editor-cursor"></span></div>`;
    } else if (isPast) {
      html += `<div class="code-line"><span class="code-${line.type}">${escapeHtml(line.text)}</span></div>`;
    } else {
      html += `<div class="code-line${dimClass}"><span class="code-${line.type}" style="opacity:0.3">${escapeHtml(line.text)}</span></div>`;
    }
  });
  html += '</div>';
  html += '</div>';
  html += '<div class="editor-status-bar">';
  html += '<div class="editor-status-left"><span class="editor-status-item">' + (gameState.editorTab === 'train' ? 'JavaScript' : 'Python') + '</span></div>';
  html += `<div class="editor-status-right"><span class="editor-status-item">Ln ${currentCodeLine + 1}</span></div>`;
  html += '</div>';
  const challengeTypes = typeof CHALLENGE_TYPES !== 'undefined' ? Object.keys(CHALLENGE_TYPES) : [];
  if (challengeTypes.length > 0) {
    if (!currentChallengeType || !challengeTypes.includes(currentChallengeType)) {
      currentChallengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    }
    const freeLeft = typeof hasFreeChallenge === 'function' && hasFreeChallenge()
      ? (DAILY_FREE_CHALLENGES - (gameState.freeChallengesUsed || 0)) : 0;
    const costLabel = freeLeft > 0 ? `Free (${freeLeft} left)` : '1 Token';
    const cooldown = typeof getChallengeCooldown === 'function' ? getChallengeCooldown() : 0;
    const isOnCooldown = cooldown > 0;
    const btnDisabled = isOnCooldown;
    const typeName = CHALLENGE_TYPES[currentChallengeType]?.name || 'Challenge';
    const btnLabel = isOnCooldown
      ? `<span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle">hourglass_top</span> ${Math.ceil(cooldown / 1000)}s`
      : `<span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle">code</span> ${typeName} (${costLabel})`;
    html += '<div class="editor-challenge-area" style="padding:8px;text-align:center;border-top:1px solid rgba(255,255,255,0.06)">';
    html += '<div style="display:flex;align-items:center;justify-content:center;gap:6px">';
    html += `<button class="btn ${btnDisabled ? 'btn-disabled' : 'btn-primary'}" onclick="tryStartChallengeWithAd('${currentChallengeType}')" ${btnDisabled ? 'disabled' : ''} style="font-size:12px;padding:6px 16px">`;
    html += btnLabel;
    html += '</button>';
    if (!isOnCooldown) {
      html += `<button class="btn btn-secondary" onclick="cycleChallengeType()" style="font-size:11px;padding:6px 8px;min-width:0" title="Switch challenge type"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">shuffle</span></button>`;
    }
    html += '</div>';
    if (!isOnCooldown) {
      const bestGrade = gameState.challengeStats && gameState.challengeStats.bestGrade;
      html += '<div style="font-size:10px;color:var(--text-muted);margin-top:3px">Win → +Rep +Papers +Compute' + (bestGrade ? ' · Best: ' + bestGrade : '') + '</div>';
    }
    html += '</div>';
  }
  html += '</div>';

  container.innerHTML = html;
  if (typeof applyCareerTheme === 'function') applyCareerTheme();
  renderGoalsCard();
  updateCompileBtn();
}

function cycleChallengeType() {
  const challengeTypes = typeof CHALLENGE_TYPES !== 'undefined' ? Object.keys(CHALLENGE_TYPES) : [];
  if (challengeTypes.length < 2) return;
  const idx = challengeTypes.indexOf(currentChallengeType);
  currentChallengeType = challengeTypes[(idx + 1) % challengeTypes.length];
  if (typeof renderEditorScreen === 'function') renderEditorScreen();
}

function updateCompileBtn() {
  const btn = document.querySelector('.compile-btn-mini');
  if (!btn) return;
  const isPapers = typeof gameState !== 'undefined' && gameState.editorTab === 'train';
  btn.textContent = isPapers ? 'Compile → Papers' : 'Compile → Compute';
}

function switchEditorTab(tab) {
  if (gameState.editorTab === tab) return;
  gameState.editorTab = tab;
  currentCodeLine = 0;
  currentCharIndex = 0;
  _lastEditorLine = -1;
  const lines = getActiveCodeLines();
  const sets = getActiveSnippetSets();
  const keys = Object.keys(sets);
  const pick = keys[Math.floor(Math.random() * keys.length)];
  lines.length = 0;
  sets[pick].forEach(l => lines.push(l));
  renderEditorScreen();
  if (typeof getTutorialTrigger === 'function' && getTutorialTrigger() === 'tab' && tab === 'train') advanceTutorial();
}

function renderModelsScreen() {
  const grid = document.getElementById('model-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const owned = getOwnedModels();
  updateGpuSlotCount();

  const modelKeys = Object.keys(MODEL_DEFS);
  owned.forEach((model) => {
    const def = MODEL_DEFS[model.id];
    const modelIndex = modelKeys.indexOf(model.id);
    const style = MODEL_ICON_STYLES[modelIndex] || MODEL_ICON_STYLES[0];
    const el = document.createElement('div');
    el.className = 'model-slot';
    el.innerHTML = `
      <div class="model-level-badge">Lv.${model.level}</div>
      ${model.count > 1 ? `<div class="model-count-badge">x${model.count}</div>` : ''}
      <div class="model-visual rarity-${def.rarity}" style="--model-color:${def.color}">
        <span class="material-symbols-outlined">${style.icon}</span>
      </div>
      <div class="model-name">${def.name}</div>
      <div class="model-lps">${formatNumber(getModelLps(model))}/s</div>
    `;
    el.style.cursor = 'pointer';
    el.onclick = () => showModelDetail(model.id);
    grid.appendChild(el);
  });

  for (let i = owned.length; i < gameState.gpuSlots; i++) {
    const el = document.createElement('div');
    el.className = 'model-slot empty';
    el.innerHTML = `
      <div class="empty-slot">
        <span class="material-symbols-outlined">add</span>
      </div>
      <div class="empty-slot-label">Open Slot</div>
    `;
    el.onclick = () => switchModelsSubTab('research');
    grid.appendChild(el);
  }

  // GPU Slot Expand button
  const gpuCost = getGpuSlotCost();
  const expandEl = document.createElement('div');
  expandEl.className = 'model-slot gpu-expand';
  expandEl.innerHTML = `
    <div class="gpu-expand-icon">
      <span class="material-symbols-outlined">add_circle</span>
    </div>
    <div class="gpu-expand-label">Expand GPU</div>
    <div class="gpu-expand-cost">${formatNumber(gpuCost)} Compute</div>
  `;
  expandEl.onclick = () => {
    if (buyGpuSlot()) {
      if (typeof SFX !== 'undefined' && SFX.buy) SFX.buy();
      renderModelsScreen();
      updateCurrencyDisplay();
    } else {
      if (typeof SFX !== 'undefined' && SFX.error) SFX.error();
      showToast(`Need ${formatNumber(gpuCost)} Compute!`, 'error');
    }
  };
  grid.appendChild(expandEl);

  // Coming Next: locked models preview
  const lockedModels = Object.entries(MODEL_DEFS)
    .filter(([id, def]) => def.unlockCost > 0 && getModelState(id)?.count === 0)
    .sort((a, b) => a[1].unlockCost - b[1].unlockCost)
    .slice(0, 3);
  if (lockedModels.length > 0) {
    const section = document.createElement('div');
    section.className = 'locked-models-section';
    section.innerHTML = '<div class="locked-models-title">Coming Next</div>';
    lockedModels.forEach(([id, def]) => {
      const pct = Math.min(100, Math.floor(gameState.compute / def.unlockCost * 100));
      const item = document.createElement('div');
      item.className = 'locked-model-item';
      item.innerHTML = `
        <span class="material-symbols-outlined locked-model-icon">lock</span>
        <div class="locked-model-info">
          <div class="locked-model-name">${def.name}</div>
          <div class="locked-model-cost">${formatNumber(def.unlockCost)} Compute · ${pct}%</div>
        </div>`;
      section.appendChild(item);
    });
    grid.parentNode.appendChild(section);
  }
}

function showModelDetail(modelId) {
  const def = MODEL_DEFS[modelId];
  const model = getModelState(modelId);
  if (!def || !model) return;
  const lps = formatNumber(getModelLps(model));
  const modelIndex = Object.keys(MODEL_DEFS).indexOf(modelId);
  const style = MODEL_ICON_STYLES[modelIndex] || MODEL_ICON_STYLES[0];

  const html = `
    <div class="model-detail">
      <div class="model-detail-header">
        <div class="model-visual rarity-${def.rarity}" style="--model-color:${def.color};width:64px;height:64px">
          <span class="material-symbols-outlined" style="font-size:32px">${style.icon}</span>
        </div>
        <div class="rarity-badge ${def.rarity}">${def.rarity[0].toUpperCase() + def.rarity.slice(1)}</div>
      </div>
      <div class="model-detail-stats">
        <div class="model-detail-row">
          <span class="model-detail-label">Level</span>
          <span class="model-detail-value">${model.level}</span>
        </div>
        <div class="model-detail-row">
          <span class="model-detail-label">Count</span>
          <span class="model-detail-value">x${model.count}</span>
        </div>
        <div class="model-detail-row">
          <span class="model-detail-label">Output</span>
          <span class="model-detail-value accent">${lps} Code/s</span>
        </div>
        <div class="model-detail-row">
          <span class="model-detail-label">Specialty</span>
          <span class="model-detail-value">${def.codeTheme}</span>
        </div>
      </div>
      <div class="model-detail-snippet">
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.4">${def.description}</div>
      </div>
    </div>
  `;

  const levelUpCost = getModelLevelUpCost(model);
  const canLevelUp = model.count >= 2 && gameState.compute >= levelUpCost;
  const buttons = [];

  if (model.count >= 2) {
    buttons.push({
      text: `Level Up (${formatNumber(levelUpCost)})`,
      primary: canLevelUp,
      disabled: !canLevelUp,
      onClick: canLevelUp ? () => {
        doSameFusion(modelId);
        saveGame();
        showToast(`Level Up! ${def.name} → Lv.${model.level + 1}`, 'success');
        renderModelsScreen();
        showModelDetail(modelId);
      } : null
    });
  }

  buttons.push({ text: 'Close', primary: model.count < 2 });
  showModalHtml(def.name, html, buttons);
}

function renderUpgradeScreen() {
  const container = document.getElementById('upgrade-content');
  if (!container) return;
  let html = '<div class="screen-desc">Spend Compute to buy upgrades and boost your AI capabilities.</div>';

  const categories = {
    agent: { name: 'Agent', icon: 'smart_toy' },
    teamAgent: { name: 'Team Agent', icon: 'groups' },
    skill: { name: 'Skill', icon: 'school' },
    infra: { name: 'Infra', icon: 'dns' },
  };

  for (const [catId, catDef] of Object.entries(categories)) {
    html += `<div class="section-header"><span class="material-symbols-outlined">${catDef.icon}</span><h2>${catDef.name}</h2></div>`;

    for (const [id, upgradeIcon] of Object.entries(UPGRADE_ICONS)) {
      if (upgradeIcon.category !== catId) continue;
      const level = gameState.upgrades[catId][id];
      const cost = getUpgradeCost(catId, id);
      const canBuy = gameState.compute >= cost;

      html += `
        <div class="upgrade-card cat-${catId} ${canBuy ? '' : 'locked'}" data-category="${catId}" data-id="${id}">
          <div class="upgrade-card-top">
            <div class="upgrade-icon-wrap ${upgradeIcon.bg}">
              <span class="material-symbols-outlined">${upgradeIcon.icon}</span>
            </div>
            <div class="upgrade-info">
              <div class="upgrade-name">
                ${UPGRADE_DEFS[catId][id].name}
                <span class="upgrade-level-badge">Lv. ${level}</span>
              </div>
              <div class="upgrade-desc">${UPGRADE_DEFS[catId][id].description}</div>
            </div>
          </div>
          <div class="upgrade-card-bottom">
            <div class="upgrade-next-info">Level ${level} → ${level + 1}</div>
            ${!canBuy ? `<div class="lock-hint"><span class="material-symbols-outlined" style="font-size:14px">lock</span> Need ${formatNumber(cost - gameState.compute)} more compute</div>` : ''}
            <button class="btn ${canBuy ? 'btn-primary' : 'btn-disabled'}"
                    onclick="doBuyUpgrade('${catId}', '${id}', event)" ${canBuy ? '' : 'disabled'}>
              ${formatNumber(cost)}
            </button>
          </div>
        </div>
      `;
    }
  }

  // GPU Expansion
  html += `<div class="section-header"><span class="material-symbols-outlined">memory</span><h2>GPU Expansion</h2></div>`;
  const gpuCost = getGpuSlotCost();
  html += `
    <div class="upgrade-card cat-infra" data-category="gpu">
      <div class="upgrade-card-top">
        <div class="upgrade-icon-wrap infra-bg">
          <span class="material-symbols-outlined">developer_board</span>
        </div>
        <div class="upgrade-info">
          <div class="upgrade-name">GPU Slot (${gameState.gpuSlots} slots)</div>
          <div class="upgrade-desc">Run more AI models simultaneously</div>
        </div>
      </div>
      <div class="upgrade-card-bottom">
        <div class="upgrade-next-info">+1 slot</div>
        <button class="btn ${gameState.compute >= gpuCost ? 'btn-primary' : 'btn-disabled'}"
                onclick="doBuyGpuSlot(event)" ${gameState.compute >= gpuCost ? '' : 'disabled'}>
          ${formatNumber(gpuCost)}
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// renderResearchScreen is now defined in research.js

// renderFusionScreen is now defined in fusion.js

function renderCareerScreen() {
  if (typeof renderPrestigeScreen === 'function') renderPrestigeScreen();
  if (typeof renderCareerAwardsPanel === 'function') renderCareerAwardsPanel();
}

function flashPurchase(btnEl, success) {
  if (!btnEl) return;
  const card = btnEl.closest('.upgrade-card');
  if (!card) return;
  if (success) {
    card.classList.add('purchase-success');
    setTimeout(() => card.classList.remove('purchase-success'), 400);
  } else {
    card.classList.add('purchase-fail');
    setTimeout(() => card.classList.remove('purchase-fail'), 400);
  }
}

function doBuyUpgrade(category, id, event) {
  const btn = event ? event.currentTarget : null;
  if (buyUpgrade(category, id)) {
    if (typeof SFX !== 'undefined' && SFX.buy) SFX.buy();
    if (typeof getTutorialTrigger === 'function' && getTutorialTrigger() === 'buy') advanceTutorial();
    flashPurchase(btn, true);
    renderUpgradeScreen();
    updateCurrencyDisplay();
  } else {
    if (typeof SFX !== 'undefined' && SFX.error) SFX.error();
    flashPurchase(btn, false);
    showToast('Not enough compute!', 'error');
  }
}

function doBuyGpuSlot(event) {
  const btn = event ? event.currentTarget : null;
  if (buyGpuSlot()) {
    if (typeof SFX !== 'undefined' && SFX.buy) SFX.buy();
    flashPurchase(btn, true);
    renderModelsScreen();
    renderUpgradeScreen();
    updateCurrencyDisplay();
  } else {
    if (typeof SFX !== 'undefined' && SFX.error) SFX.error();
    flashPurchase(btn, false);
    showToast('Not enough compute!', 'error');
  }
}

window.addEventListener('DOMContentLoaded', startGame);
