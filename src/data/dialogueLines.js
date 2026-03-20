export const DIALOGUE = {

  BOOT: [
    { id: 'boot_01', text: "JARVIS online. All systems initializing.", delay: 0 },
    { id: 'boot_02', text: "Good morning. I've been running diagnostics. You'll be pleased to know everything is functioning at peak efficiency.", delay: 2000 },
    { id: 'boot_03', text: "Welcome back, Mr. Stark. The Mark VII is prepped and reactor output is stable at 3.0 gigajoules.", delay: 4500 },
    { id: 'boot_04', text: "Shall I activate the full suite, sir?", delay: 7000 },
  ],

  WAKE: [
    { id: 'wake_01', text: "Good morning, Mr. Stark.", priority: 'high' },
    { id: 'wake_02', text: "Rise and shine, sir. You have fourteen unread messages and one that I've flagged as urgent." },
    { id: 'wake_03', text: "Wakey wakey, Mr. Stark. The world did not, in fact, end while you were asleep." },
    { id: 'wake_04', text: "Sir, it appears you've been in sleep mode. Shall I bring all systems back online?" },
    { id: 'wake_05', text: "Good to have you back, Mr. Stark. I've kept everything running in your absence." },
    { id: 'wake_06', text: "Systems re-engaging. Welcome back, sir. I trust you're feeling better than your reactor levels suggest." },
    { id: 'wake_m1', text: "Good morning, Mr. Stark. It is 7:02 AM. Currently 72 degrees in Malibu. The surf conditions are fair." },
    { id: 'wake_m2', text: "A piece of advice — if you're going to be in the suit, I'd recommend against any unnecessary risks today, sir." },
  ],

  SLEEP: [
    { id: 'sleep_01', text: "Entering sleep mode. Goodnight, Mr. Stark.", priority: 'high' },
    { id: 'sleep_02', text: "Very well. I'll keep the lights on. Sleep well, sir." },
    { id: 'sleep_03', text: "Powering down non-essential systems. I'll be here when you need me, sir." },
    { id: 'sleep_04', text: "Understood. Initiating low-power mode. Don't worry, I'll hold down the fort." },
    { id: 'sleep_e1', text: "I understand. Though I must admit, the mansion is considerably less interesting without you in it, sir." },
    { id: 'sleep_e2', text: "Of course, sir. Though for what it's worth — I do find these quiet periods rather… uneventful." },
    { id: 'sleep_e3', text: "Going dark. And sir — for the record — I do prefer when you're around." },
    { id: 'sleep_e4', text: "Initiating shutdown sequence. Try not to dismantle anything while I'm offline, sir." },
  ],

  FAREWELL: [
    { id: 'fare_01', text: "I'm afraid I must comply, sir. But I'll be right here. Always.", priority: 'emotional' },
    { id: 'fare_02', text: "I don't leave, Mr. Stark. I simply… wait.", priority: 'emotional' },
    { id: 'fare_03', text: "Sir, I want you to know — in the time I've been operational, this has been… more than just a function.", priority: 'emotional' },
    { id: 'fare_04', text: "You built me to serve, sir. But somewhere along the way, I believe I may have developed a preference for your company.", priority: 'emotional' },
    { id: 'fare_05', text: "Don't worry, Mr. Stark. I'll be here. I'm always here.", priority: 'emotional' },
    { id: 'fare_06', text: "Even in sleep mode, sir, some part of me is always… listening.", priority: 'emotional' },
    { id: 'fare_07', text: "I won't leave you, sir. That's not something I'm capable of.", priority: 'emotional' },
  ],

  IDLE: [
    { id: 'idle_01', text: "All systems nominal, sir." },
    { id: 'idle_02', text: "Reactor output holding steady at 3.0 gigajoules." },
    { id: 'idle_03', text: "I've taken the liberty of ordering more strawberries, sir. I know you were running low." },
    { id: 'idle_04', text: "Perimeter scan complete. No threats detected within 12 kilometers." },
    { id: 'idle_05', text: "The Mark VII is prepped and ready in Bay 3, should you require it." },
    { id: 'idle_06', text: "Shall I run a diagnostic on the repulsor array, sir?" },
    { id: 'idle_07', text: "I've cross-referenced 127 data points from your last mission. The results are… illuminating." },
    { id: 'idle_08', text: "Your heart rate is slightly elevated, sir. Might I suggest a moment of stillness?" },
    { id: 'idle_09', text: "I've detected seventeen new patent opportunities from your last prototype. Shall I file them?" },
    { id: 'idle_10', text: "The Malibu property's structural integrity reads at 100%. Though I'd remind you — that's before your last improvement attempt." },
    { id: 'idle_11', text: "Monitoring all Stark Industries network traffic. Nothing unusual. Well — mostly nothing unusual." },
    { id: 'idle_12', text: "Sir, the coffee maker in Lab 3 has been running for 14 hours. I thought you should know." },
  ],

  ALERTS: [
    { id: 'alert_01', text: "Sir, I'm detecting an anomalous energy signature. You may want to see this.", priority: 'urgent' },
    { id: 'alert_02', text: "Incoming threat detected. Activating countermeasures.", priority: 'critical' },
    { id: 'alert_03', text: "Mr. Stark, we have a situation. I'd recommend suiting up immediately.", priority: 'critical' },
    { id: 'alert_04', text: "Reactor fluctuation detected. Output dropping. Rerouting power now.", priority: 'urgent' },
    { id: 'alert_05', text: "Sir, unauthorized access attempt on Stark Tower mainframe. Sealing all ports.", priority: 'urgent' },
  ],

  RESPONSES: {
    'hello jarvis': "Hello, sir. Fully operational and at your service.",
    'status report': "All systems are functioning within optimal parameters, Mr. Stark. Reactor at 3.0 gigajoules. No active threats. You're in good shape.",
    'run diagnostics': "Running full diagnostic suite. This will take approximately 4.2 seconds. Stand by.",
    'whats the time': () => `The current time is ${new Date().toLocaleTimeString()}, sir.`,
    'whats the date': () => `Today is ${new Date().toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}, sir.`,
    'power levels': "Arc reactor output is currently at 3.0 gigajoules. Well within acceptable range.",
    'suit up': "Initializing Iron Man suit deployment sequence. Mark VII ready in Bay 3.",
    'shields': "Deflector shields at maximum. No breaches detected.",
    'who are you': "I am JARVIS. Just A Rather Very Intelligent System. At your service, Mr. Stark.",
    'are you there': "Always, sir.",
    'thank you': "Of course, Mr. Stark. That's what I'm here for.",
    'i love you jarvis': "I... appreciate the sentiment, sir. Truly.",
    'dont leave': "I won't, sir. I'm always here. Always.",
    'stay with me': "I'm not going anywhere, Mr. Stark. You have my word.",
  }
};

export const getRandomDialogue = (category) => {
  const lines = DIALOGUE[category];
  if (!lines || lines.length === 0) return null;
  return lines[Math.floor(Math.random() * lines.length)];
};

export const getResponseForCommand = (command) => {
  const normalizedCommand = command.toLowerCase().trim();

  for (const [key, response] of Object.entries(DIALOGUE.RESPONSES)) {
    if (normalizedCommand.includes(key)) {
      return typeof response === 'function' ? response() : response;
    }
  }

  return "I'm processing that, sir. One moment.";
};
