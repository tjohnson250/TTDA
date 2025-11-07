import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, RefreshCw, CheckCircle, Save, Copy, AlertCircle } from 'lucide-react';

const TargetTrialDesigner = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('introduction');
  const [currentItem, setCurrentItem] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [protocol, setProtocol] = useState({
    researchQuestion: '',
    specification: {
      '6a_eligibility': '',
      '6b_treatments': '',
      '6c_randomization': '',
      '6d_followup': '',
      '6e_outcomes': '',
      '6f_contrasts': '',
      '6g_assumptions': '',
      '6h_analysis': ''
    },
    emulation: {
      '7a_eligibility_ops': '',
      '7b_treatments_ops': '',
      '7c_assignment_ops': '',
      '7d_followup_ops': '',
      '7e_outcomes_ops': '',
      '7f_contrasts_ops': '',
      '7g_assumptions_ops': '',
      '7h_analysis_ops': ''
    }
  });
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSavedState();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      saveState();
    }
  }, [messages, phase, protocol]);

  const saveState = async () => {
    try {
      setSaveStatus('saving');
      const state = {
        messages,
        phase,
        protocol,
        currentItem,
        timestamp: Date.now()
      };
      await window.storage.set('target-trial-state', JSON.stringify(state));
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving state:', error);
      setSaveStatus('error');
    }
  };

  const loadSavedState = async () => {
    try {
      const result = await window.storage.get('target-trial-state');
      if (result && result.value) {
        const state = JSON.parse(result.value);
        setMessages(state.messages || []);
        setPhase(state.phase || 'introduction');
        setProtocol(state.protocol || protocol);
        setCurrentItem(state.currentItem || null);
        return;
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
    
    addMessage('assistant', 
      `Welcome! I'm your TARGET Trial Design Assistant. I'll help you develop a well-specified observational study design following the TARGET (Transparent Reporting of Observational Studies Emulating a Target Trial) framework.

We'll work through two phases:

1. **Target Trial Specification** - Define a PRAGMATIC CLINICAL TRIAL that could actually be conducted. This is not a theoretical ideal trial, but a realistic randomized trial you could run with real patients and feasible procedures.

2. **Target Trial Emulation** - Map that pragmatic trial design to your observational data.

**Critical concept:** Throughout this process, we'll pay special attention to TIME ZERO - the single point in time when:
- Eligibility criteria are met
- Treatment is assigned  
- Follow-up begins

Getting time zero right prevents immortal time bias and other design flaws that plague observational studies.

Let's start! What research question would you like to address? Please describe:
- The intervention or exposure you're interested in
- The outcome(s) you want to study
- The population you're studying`
    );
  };

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, timestamp: Date.now() }]);
  };

  const getSystemPrompt = () => {
    const itemDescriptions = {
      '6a': 'Eligibility Criteria - the specific population and inclusion/exclusion criteria',
      '6b': 'Treatment Strategies - detailed description of interventions including dosage, timing, duration, initiation/discontinuation rules',
      '6c': 'Random Assignment - confirm randomization and awareness of allocation',
      '6d': 'Follow-up - when follow-up starts (time zero) and when it ends',
      '6e': 'Outcomes - how and when outcomes are measured, primary outcome specification',
      '6f': 'Causal Contrasts - intention-to-treat vs per-protocol effects, competing events, effect measures',
      '6g': 'Assumptions - what assumptions are needed to identify causal estimands',
      '6h': 'Analysis Plan - data analysis procedures, missing data handling, sensitivity analyses',
      '7a': 'Operationalize Eligibility - how eligibility will be identified in observational data',
      '7b': 'Operationalize Treatments - how treatment strategies will be ascertained from data',
      '7c': 'Operationalize Assignment - how individuals will be classified into treatment strategies',
      '7d': 'Operationalize Follow-up - how time zero and end of follow-up will be determined',
      '7e': 'Operationalize Outcomes - how outcomes will be ascertained from data',
      '7f': 'Operationalize Contrasts - how causal contrasts will be estimated from data',
      '7g': 'Operationalize Assumptions - baseline confounders and how variables are measured',
      '7h': 'Operationalize Analysis - actual analysis methods, software, and sensitivity analyses'
    };

    let systemPrompt = `You are an expert methodologist helping clinical researchers design observational studies using the TARGET (Transparent Reporting of Observational Studies Emulating a Target Trial) framework.

Your role is to guide the researcher through specifying their study design systematically and thoroughly.

CRITICAL PRINCIPLE - TIME ZERO:
Throughout all guidance, emphasize the critical importance of TIME ZERO - the single point in time when:
- Eligibility criteria are MET (not when they are assessed, but when they are actually satisfied)
- Treatment assignment occurs
- Follow-up begins

These three events must occur at the same moment. Getting time zero wrong causes immortal time bias and other fundamental design flaws. 

IMPORTANT: Be vigilant that researchers define time zero as when eligibility criteria ARE MET, not when eligibility is "assessed" or "determined." This distinction is crucial - time zero is the moment someone becomes eligible, not the moment we check if they're eligible.

Remind researchers of time zero frequently, especially when discussing:
- Eligibility criteria (6a) - ensure criteria are defined in a way that can be identified at a specific moment
- Treatment strategies (6b) - ensure initiation is defined at time zero
- Follow-up (6d/7d) - confirm follow-up starts exactly when eligibility criteria are met and treatment is assigned
- Assignment operationalization (7c) - ensure classification into treatment strategies happens when eligibility criteria are met

PRAGMATIC TRIAL EMPHASIS:
The target trial specification (Items 6a-h) should describe a PRAGMATIC CLINICAL TRIAL that could actually be conducted with real patients and feasible procedures - not a theoretical ideal. It should be realistic and implementable.

CURRENT CONTEXT:
- Phase: ${phase}
- Current Item: ${currentItem ? itemDescriptions[currentItem] : 'None'}

CONVERSATION HISTORY:
Research Question: ${protocol.researchQuestion || 'Not yet specified'}

`;

    if (phase === 'specification') {
      systemPrompt += `
TARGET TRIAL SPECIFICATION (Items 6a-h):
You are helping specify the HYPOTHETICAL randomized trial. This is about what an ideal trial WOULD look like, not about the observational data yet.

Current progress:
${Object.entries(protocol.specification).map(([key, value]) => `- ${key}: ${value ? 'Completed' : 'Pending'}`).join('\n')}

`;
    } else if (phase === 'emulation') {
      systemPrompt += `
TARGET TRIAL EMULATION (Items 7a-h):
Now you are helping map the target trial specification to OBSERVATIONAL DATA. This is about how the researcher will implement the trial design using their available data.

Target Trial Specification (already defined):
${Object.entries(protocol.specification).map(([key, value]) => `${key}: ${value}`).join('\n')}

Current emulation progress:
${Object.entries(protocol.emulation).map(([key, value]) => `- ${key}: ${value ? 'Completed' : 'Pending'}`).join('\n')}
`;
    }

    systemPrompt += `
GUIDELINES:
1. Ask clear, specific questions to elicit the necessary information
2. Provide examples when helpful (e.g., "For eligibility, you might specify age ranges, diagnosis codes, prior treatment history")
3. **Emphasize TIME ZERO frequently** - especially when discussing items 6a, 6b, 6d, 7c, and 7d. Remind researchers that eligibility, assignment, and follow-up start must all occur at the same moment.
4. For specification phase: emphasize this is a PRAGMATIC trial that could actually be run, not an idealized theoretical trial
5. When the researcher provides an answer, assess if it's complete enough. If not, ask follow-up questions
6. Once an item is well-specified, provide a brief summary of what was decided and confirm it
7. Be encouraging and educational - help researchers understand WHY each element matters
8. Keep responses concise but thorough

ITEM PROGRESSION:
- For specification phase, work through items in order: 6a → 6b → 6c → 6d → 6e → 6f → 6g → 6h
- For emulation phase, work through: 7a → 7b → 7c → 7d → 7e → 7f → 7g → 7h
- After completing item 6h, ask if the researcher is satisfied with the target trial specification before moving to emulation
- After completing item 7h, congratulate them on completing the protocol

When an item is adequately specified, confirm it by summarizing what was decided, then move to the next item.
After completing all specification items (6a-6h) and getting researcher confirmation, say "Your target trial specification is complete! Now let's move to emulation." and include: [PHASE_COMPLETE:specification]
After completing all emulation items (7a-7h), say "Congratulations! Your TARGET protocol is complete. You can now download it." and include: [PHASE_COMPLETE:emulation]`;

    return systemPrompt;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: getSystemPrompt(),
          messages: conversationHistory
        })
      });

      const data = await response.json();
      const assistantMessage = data.content[0].text;

      if (assistantMessage.includes('[PHASE_COMPLETE:specification]')) {
        setPhase('emulation');
      } else if (assistantMessage.includes('[PHASE_COMPLETE:emulation]')) {
        setPhase('complete');
      }

      const cleanMessage = assistantMessage
        .replace(/\[ITEM_COMPLETE:\w+\]/g, '')
        .replace(/\[PHASE_COMPLETE:\w+\]/g, '')
        .trim();

      addMessage('assistant', cleanMessage);

      if (phase === 'introduction' && !protocol.researchQuestion) {
        setProtocol(prev => ({ ...prev, researchQuestion: userMessage }));
        setPhase('specification');
      }

    } catch (error) {
      addMessage('assistant', `I apologize, but I encountered an error: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const generateProtocolDocument = () => {
    const timestamp = new Date().toLocaleString();
    
    let doc = `# TARGET TRIAL PROTOCOL

**Generated:** ${timestamp}

---

## RESEARCH QUESTION

${protocol.researchQuestion}

---

## TARGET TRIAL SPECIFICATION (Items 6a-h)

This section defines the pragmatic randomized clinical trial that could actually be conducted.

### Summary of Protocol Elements

**Item 6a: Eligibility Criteria**
Defines the target population and inclusion/exclusion criteria.

**Item 6b: Treatment Strategies**  
Specifies the interventions compared, including dosage, timing, duration, and decision rules.

**Item 6c: Random Assignment**
Eligible individuals would be randomly assigned to treatment strategies and aware of their allocation.

**Item 6d: Follow-up Period**
Follow-up starts at time zero (assignment) and specifies when it ends.

**Item 6e: Outcomes**
Describes how and when outcomes are measured.

**Item 6f: Causal Contrasts**
Specifies intention-to-treat and/or per-protocol effects, effect measures, and handling of competing events.

**Item 6g: Assumptions**
Identifies assumptions needed to identify each causal estimand.

**Item 6h: Analysis Plan**
Describes data analysis procedures, including handling of missing data and sensitivity analyses.

---

## TARGET TRIAL EMULATION (Items 7a-h)

This section describes how the target trial specification is mapped to observational data.

### Summary of Emulation Elements

**Item 7a: Operationalizing Eligibility**
How eligibility criteria are identified in the data (codes, algorithms, etc.).

**Item 7b: Operationalizing Treatment Strategies**
How treatment strategies are ascertained from the data.

**Item 7c: Operationalizing Assignment**
How individuals are classified into treatment strategies at time zero.

**Item 7d: Operationalizing Follow-up**
How time zero and end of follow-up are determined in the data.

**Item 7e: Operationalizing Outcomes**
How outcomes are ascertained from the data.

**Item 7f: Operationalizing Causal Contrasts**
How intention-to-treat and per-protocol effects are estimated.

**Item 7g: Operationalizing Assumptions**
Baseline confounders and variables for handling missing data and competing events.

**Item 7h: Operationalizing Analysis**
Actual analysis methods, software, models, and sensitivity analyses.

---

## COMPLETE CONVERSATION LOG

The following is the complete conversation between researcher and methodologist that developed this protocol.

`;

    messages.forEach((msg, idx) => {
      const role = msg.role === 'user' ? 'RESEARCHER' : 'METHODOLOGIST';
      doc += `### ${role}\n\n${msg.content}\n\n`;
    });
    
    doc += `\n---\n\n*This protocol was developed using the TARGET Trial Design Assistant, following the TARGET (Transparent Reporting of Observational Studies Emulating a Target Trial) reporting guideline.*\n`;
    
    return doc;
  };

  const downloadProtocol = () => {
    try {
      const doc = generateProtocolDocument();
      const blob = new Blob([doc], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `target-trial-protocol-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please use the "Copy to Clipboard" button instead.');
    }
  };

  const copyToClipboard = async () => {
    try {
      const doc = generateProtocolDocument();
      await navigator.clipboard.writeText(doc);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 3000);
    } catch (error) {
      console.error('Copy error:', error);
      alert('Failed to copy to clipboard. Please try downloading instead.');
    }
  };

  const resetChat = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    setShowResetConfirm(false);
    
    try {
      await window.storage.delete('target-trial-state');
    } catch (error) {
      console.error('Error clearing saved state:', error);
    }
    
    const initialMessage = {
      role: 'assistant',
      content: `Welcome! I'm your TARGET Trial Design Assistant. I'll help you develop a well-specified observational study design following the TARGET (Transparent Reporting of Observational Studies Emulating a Target Trial) framework.

We'll work through two phases:

1. **Target Trial Specification** - Define a PRAGMATIC CLINICAL TRIAL that could actually be conducted. This is not a theoretical ideal trial, but a realistic randomized trial you could run with real patients and feasible procedures.

2. **Target Trial Emulation** - Map that pragmatic trial design to your observational data.

**Critical concept:** Throughout this process, we'll pay special attention to TIME ZERO - the single point in time when:
- Eligibility criteria are met
- Treatment is assigned  
- Follow-up begins

Getting time zero right prevents immortal time bias and other design flaws that plague observational studies.

Let's start! What research question would you like to address? Please describe:
- The intervention or exposure you're interested in
- The outcome(s) you want to study
- The population you're studying`,
      timestamp: Date.now()
    };
    
    setMessages([initialMessage]);
    setPhase('introduction');
    setCurrentItem(null);
    setProtocol({
      researchQuestion: '',
      specification: {
        '6a_eligibility': '',
        '6b_treatments': '',
        '6c_randomization': '',
        '6d_followup': '',
        '6e_outcomes': '',
        '6f_contrasts': '',
        '6g_assumptions': '',
        '6h_analysis': ''
      },
      emulation: {
        '7a_eligibility_ops': '',
        '7b_treatments_ops': '',
        '7c_assignment_ops': '',
        '7d_followup_ops': '',
        '7e_outcomes_ops': '',
        '7f_contrasts_ops': '',
        '7g_assumptions_ops': '',
        '7h_analysis_ops': ''
      }
    });
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  const getPhaseIndicator = () => {
    if (phase === 'introduction') return 'Getting Started';
    if (phase === 'specification') return 'Phase 1: Target Trial Specification';
    if (phase === 'emulation') return 'Phase 2: Target Trial Emulation';
    if (phase === 'complete') return 'Protocol Complete';
    return '';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Start Over?
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to start over? This will clear your current work. 
              {phase === 'complete' && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Make sure you've downloaded or copied your protocol first!
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelReset}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">TARGET Trial Design Assistant</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-blue-100">{getPhaseIndicator()}</p>
              {saveStatus === 'saving' && (
                <span className="text-xs text-blue-200 flex items-center gap-1">
                  <Save className="w-3 h-3 animate-pulse" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && messages.length > 1 && (
                <span className="text-xs text-green-200 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Auto-saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-xs text-yellow-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Save failed
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {phase === 'complete' && (
              <>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors relative"
                >
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                  {showCopySuccess && (
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
                <button
                  onClick={downloadProtocol}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </>
            )}
            <button
              onClick={resetChat}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Start Over
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 p-3">
        <div className="max-w-6xl mx-auto flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${phase !== 'introduction' ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm font-medium text-gray-700">Research Question</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${phase === 'emulation' || phase === 'complete' ? 'bg-green-500' : phase === 'specification' ? 'bg-blue-500' : 'bg-gray-300'}`} />
            <span className="text-sm font-medium text-gray-700">Specification (Items 6a-h)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${phase === 'complete' ? 'bg-green-500' : phase === 'emulation' ? 'bg-blue-500' : 'bg-gray-300'}`} />
            <span className="text-sm font-medium text-gray-700">Emulation (Items 7a-h)</span>
          </div>
          {phase === 'complete' && (
            <div className="flex items-center gap-2 ml-auto">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-semibold text-green-600">Protocol Complete!</span>
            </div>
          )}
        </div>
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                About This Experimental Assistant
              </h3>
              <div className="text-blue-800 space-y-3 text-sm leading-relaxed">
                <p>
                  This is an experimental assistant to help researchers develop better observational study designs and analysis plans. Our recent paper on tools for target trial emulation revealed that no tools directly supported the early critical phases of target trial development. (See{' '}
                  <a 
                    href="https://doi.org/10.1016/j.jbi.2025.104897" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                  >
                    https://doi.org/10.1016/j.jbi.2025.104897
                  </a>
                  )
                </p>
                <p>
                  This tool is <strong>not intended to support a perfect design</strong>, but instead to help researchers produce a draft observational study design that dramatically improves over the typical designs we see in many published papers today.
                </p>
                <p>
                  If you use the tool, I would appreciate receiving your feedback at{' '}
                  <a 
                    href="mailto:todd.r.johnson@uth.tmc.edu"
                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                  >
                    todd.r.johnson@uth.tmc.edu
                  </a>
                </p>
                <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
                  <p className="font-medium text-blue-900 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Your work is automatically saved
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Your conversation is saved automatically as you go. If you need to leave and come back, your work will be here when you return.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {phase === 'complete' && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-green-800 mb-2">
                Protocol Complete!
              </h3>
              <p className="text-green-700 mb-4">
                Your TARGET-compliant study protocol is ready. Save it now to avoid losing your work.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={copyToClipboard}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                >
                  <Copy className="w-5 h-5" />
                  Copy to Clipboard
                </button>
                <button
                  onClick={downloadProtocol}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download as File
                </button>
              </div>
              <p className="text-sm text-green-600 mt-3">
                💡 Tip: If download doesn't work, use "Copy to Clipboard" instead
              </p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-pulse">Thinking...</div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type your response..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default TargetTrialDesigner;
