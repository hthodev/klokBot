const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { LoremIpsum } = require('lorem-ipsum');
const colors = require('colors');
const readline = require('readline');
const { HttpsProxyAgent } = require('https-proxy-agent');
const ethers = require('ethers');
const crypto = require('crypto');

const CONFIG = {
  API_BASE_URL: 'https://api1-pp.klokapp.ai/v1',
  PRIVATE_KEY_FILE: 'wallets.txt',
  PROXY_FILE: 'proxies.txt',
  MIN_INTERVAL: 10000,
  MAX_INTERVAL: 30000,
  MAX_FAILED_ATTEMPTS: 3,
  RETRY_DELAY: 3000,
  MAX_RETRIES: 3,
};

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 2,
    min: 1
  },
  wordsPerSentence: {
    max: 10,
    min: 4
  }
});

function log(msg, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  switch(type) {
    case 'success':
      console.log(`[${timestamp}] [✓] ${msg}`.green);
      break;
    case 'custom':
      console.log(`[${timestamp}] [*] ${msg}`.magenta);
      break;        
    case 'error':
      console.log(`[${timestamp}] [✗] ${msg}`.red);
      break;
    case 'warning':
      console.log(`[${timestamp}] [!] ${msg}`.yellow);
      break;
    default:
      console.log(`[${timestamp}] [ℹ] ${msg}`.blue);
  }
}

async function countdown(seconds) {
  for (let i = seconds; i > 0; i--) {
    const timestamp = new Date().toLocaleTimeString();
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`[${timestamp}] [*] Chờ ${i} giây để tiếp tục...`.magenta);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout, 0);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(operation, retryMessage, accountIndex = null, maxRetries = CONFIG.MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const logPrefix = accountIndex !== null ? `Tài khoản ${accountIndex + 1}` : '';
      log(`${logPrefix}${logPrefix ? ': ' : ''}${retryMessage} - Lỗi: ${error.message || error}. Thử lại lần ${attempt}/${maxRetries}`, 'warning');
      
      if (attempt < maxRetries) {
        await sleep(CONFIG.RETRY_DELAY);
      }
    }
  }
  
  throw lastError;
}

function getRandomMessage() {
  const method = Math.floor(Math.random() * 5);

  switch (method) {
    case 0:
      return lorem.generateSentences(1);

    case 1:
      const topics = [
        "artificial intelligence",
        "machine learning",
        "technology",
        "science",
        "nature",
        "philosophy",
        "art",
        "music",
        "history",
        "literature",
        "psychology",
        "space exploration",
        "quantum computing",
        "economics",
        "cryptocurrency",
        "sustainable energy",
        "ancient civilizations",
        "modern architecture",
        "robotics",
        "health and wellness",
      ];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      const questionTemplates = [
        `What do you think about ${randomTopic}?`,
        `Can you tell me something interesting about ${randomTopic}?`,
        `How has ${randomTopic} changed in recent years?`,
        `Why is ${randomTopic} important?`,
        `What's your favorite aspect of ${randomTopic}?`,
        `How do you see ${randomTopic} evolving in the future?`,
        `What impact does ${randomTopic} have on our daily lives?`,
        `Who are some key figures in the field of ${randomTopic}?`,
        `What's a common misconception about ${randomTopic}?`,
        `How can someone start learning about ${randomTopic}?`,
        `How do you think space exploration will evolve in the next 50 years?`,
        `What are the ethical concerns surrounding artificial intelligence?`,
        `Why do you think history tends to repeat itself?`,
        `What impact has cryptocurrency had on the global economy?`,
        `How does quantum computing differ from classical computing?`,
        `What role does philosophy play in modern society?`,
        `How has machine learning changed the way we process data?`,
        `Why is sustainable energy crucial for the future?`,
        `What can we learn from ancient civilizations?`,
        `How does psychology help us understand human behavior?`,
        `How will artificial intelligence shape the job market in the future?`,
        `What are the biggest challenges facing space exploration today?`,
        `Why do some people find philosophy difficult to understand?`,
        `How has climate change affected different parts of the world?`,
        `What role does music play in shaping cultures?`,
        `How does machine learning help in medical research?`,
        `What are some common myths about quantum physics?`,
        `How has social media changed the way we communicate?`,
        `Why is psychology important in everyday life?`,
        `What are some ethical concerns about genetic engineering?`,
        `How do video games influence brain development?`,
        `What lessons can we learn from ancient civilizations?`,
        `How does literature reflect the values of a society?`,
        `What’s the most underrated invention in technology?`,
        `How do different cultures define happiness?`,
        `What are the dangers of relying too much on automation?`,
        `How does space weather affect Earth?`,
        `Why do some people believe in conspiracy theories?`,
        `What are the benefits of learning multiple languages?`,
        `How can neuroscience help us understand human emotions?`,
        `How will artificial intelligence impact creative fields like art and music?`,
        `What are the long-term effects of social media on human relationships?`,
        `How do black holes work, and what mysteries do they hold?`,
        `What are the biggest breakthroughs in biotechnology today?`,
        `Why do people find philosophy both fascinating and frustrating?`,
        `What’s the impact of fast fashion on the environment?`,
        `How has cybersecurity evolved to keep up with modern threats?`,
        `What are the ethical concerns of cloning and genetic modification?`,
        `How does space travel affect the human body?`,
        `Why do humans dream, and what do dreams mean?`,
        `What are the biggest challenges facing renewable energy today?`,
        `How do different cultures define happiness and success?`,
        `What would happen if gravity on Earth suddenly changed?`,
        `How does climate change influence global migration patterns?`,
        `Why do humans have such a strong desire to explore the unknown?`,
        `What are the psychological effects of living in space for long periods?`,
        `How do economic policies shape innovation and technological progress?`,
        `What are the real dangers of artificial superintelligence?`,
        `Why do people believe in astrology and superstitions?`,
        `What are the biggest misconceptions about evolution?`,
      ];
      return questionTemplates[
        Math.floor(Math.random() * questionTemplates.length)
      ];

    case 2:
      const conversationalPrompts = [
        "Tell me something I might not know.",
        "What's the most interesting thing you've learned recently?",
        "If you could solve one global problem, what would it be?",
        "What's a book or article that changed your perspective?",
        "What's a common misconception many people have?",
        "How would you explain complex ideas to someone new to the topic?",
        "What advancements do you think we'll see in the next decade?",
        "What's a skill everyone should learn?",
        "How do you approach learning something new?",
        "What makes a good conversation in your opinion?",
        "If you could meet any historical figure, who would it be and why?",
        "What's an underrated invention that changed the world?",
        "How do you define success?",
        "What’s a habit that significantly improved your life?",
        "What’s a topic you could talk about for hours?",
        "If you could instantly master one subject, what would it be?",
        "What’s something futuristic you hope to see in your lifetime?",
        "How do you think AI will change human creativity?",
        "What’s the best piece of advice you’ve ever received?",
        "If you had to give a TED Talk, what would it be about?",
        "If you could instantly master any subject, what would it be?",
        "What’s a book or movie that changed your perspective?",
        "If you had to explain your favorite topic to a 5-year-old, how would you do it?",
        "What’s one thing most people misunderstand about your field of interest?",
        "If you could travel back in time and witness one historical event, which one would it be?",
        "What’s a small change in daily life that could have a huge impact on the world?",
        "How would you design the perfect city of the future?",
        "What’s the most fascinating fact you’ve learned recently?",
        "If you could ask a scientist from the past one question, what would it be?",
        "What’s one habit that has drastically improved your life?",
        "What’s the most thought-provoking question you’ve ever been asked?",
        "If you could instantly learn any new skill, what would it be?",
        "What’s the best advice you’ve ever received?",
        "If you had unlimited time and resources, what project would you start?",
        "What’s a small daily habit that has improved your life?",
        "If you could meet one historical figure, who would it be and why?",
        "What’s the most surprising thing about your field of work or study?",
        "If you could live in any time period, past or future, which would you choose?",
        "What’s something you’re passionate about that others might not understand?",
        "How do you usually approach solving a complex problem?",
        "If you could only ask one question to a time traveler, what would it be?",
        "What’s a skill you wish more people took the time to learn?",
        "What do you think is the most important invention of the last century?",
        "How do you personally define success?",
        "What’s an underrated life skill that everyone should master?",
        "If you had to explain your favorite topic to a child, how would you do it?",
        "What’s a common misconception that people have about your interests?",
        "What’s the best way to make a difficult decision?",
        "If you could have dinner with any three people, living or dead, who would they be?",
        "What’s a question you’ve always wanted to ask someone but never had the chance?",
        "If you could witness any historical event firsthand, which one would it be?",
        "What’s the strangest but most useful piece of advice you’ve ever received?",
        "If you could instantly know any language, which one would you choose?",
        "What’s one skill you think will be essential in the future?",
        "If you had to explain your job to a caveman, how would you do it?",
        "What’s something you used to believe, but later realized was wrong?",
        "If you had an unlimited budget for research, what would you study?",
        "What’s one habit that successful people tend to have?",
        "If you had a time machine, would you go to the past or the future?",
        "What’s a controversial opinion you have about a common topic?",
        "If you could be famous for something, what would you want it to be?",
        "What’s a simple thing in life that brings you a lot of happiness?",
        "If you could swap lives with any fictional character, who would it be?",
        "What’s the weirdest fact you know that sounds fake but is true?",
        "If you had to describe yourself in only three words, what would they be?",
        "What’s one thing you think more people should try at least once?",
        "If you had to teach a class on something, what would it be?",
        "What’s the most underrated invention in human history?",
        "If you could erase one thing from history, what would it be?",
        "What’s something you wish you had learned earlier in life?",
      ];
      return conversationalPrompts[
        Math.floor(Math.random() * conversationalPrompts.length)
      ];

    case 3:
      const funFacts = [
        "Did you know octopuses have three hearts?",
        "The Eiffel Tower can grow taller in the summer due to heat expansion.",
        "Bananas are berries, but strawberries aren't.",
        "Sharks have been around longer than trees.",
        "Honey never spoils—it can last thousands of years.",
        "There's enough gold in Earth's core to coat the planet in a layer 1.5 feet thick.",
        "Water can boil and freeze at the same time in a process called the 'triple point'.",
        "A day on Venus is longer than a year on Venus.",
        "Sloths can hold their breath longer than dolphins can.",
        "Butterflies can taste with their feet.",
        `Did you know a single teaspoon of honey is the life’s work of 12 bees?`,
        `There are more stars in the universe than grains of sand on Earth.`,
        `The human brain generates enough electricity to power a small lightbulb.`,
        `Some turtles can breathe through their butts!`,
        `The shortest war in history lasted only 38 to 45 minutes.`,
        `Water can boil and freeze at the same time under the right conditions.`,
        `A day on Venus is longer than a year on Venus.`,
        `Bananas are berries, but strawberries aren’t.`,
        `Octopuses have three hearts, and their blood is blue.`,
        `The Eiffel Tower can grow taller in summer due to heat expansion.`,
        `A shrimp’s heart is located in its head.`,
        `The longest word in English has 189,819 letters (a protein name).`,
        `Wombat poop is cube-shaped.`,
        `There’s a species of jellyfish that can live forever!`,
        `You can hear a blue whale’s heartbeat from over 2 miles away.`,
        `A single cloud can weigh more than a million pounds.`,
        `Bananas share 60% of their DNA with humans.`,
        `The Eiffel Tower leans slightly away from the sun due to heat expansion.`,
        `A day on Mercury lasts longer than its year.`,
        `Some turtles can breathe through their butts.`,
        `There are more possible chess games than atoms in the known universe.`,
        `The average human spends 5 years of their life eating.`,
        `Honey never spoils—it can last thousands of years.`,
        `A cockroach can live for weeks without its head.`,
        `The inventor of the frisbee was turned into a frisbee after he died.`,
        `Sloths can hold their breath longer than dolphins.`,
        `An octopus has nine brains and blue blood.`,
        `The world's smallest reptile was discovered in 2021—it fits on your fingertip.`,
        `A group of flamingos is called a "flamboyance."`,
        `The shortest war in history lasted only 38 minutes.`,
        `The moon is slowly drifting away from Earth at a rate of 3.8 cm per year.`,
        `A single lightning bolt is five times hotter than the surface of the sun.`,
        `The human body contains about 37.2 trillion cells.`,
        `There’s a planet made entirely of diamonds called 55 Cancri e.`,
        `Cows have best friends and get stressed when separated from them.`,
        `Venus rotates so slowly that a day is longer than a year on the planet.`,
        `A blue whale’s heart weighs as much as a small car.`,
        `The tongue of a blue whale is heavier than an elephant.`,
        `The world’s largest living structure is the Great Barrier Reef.`,
        `Octopuses can change color in an instant to blend into their surroundings.`,
        `Butterflies can taste with their feet.`,
        `The average human sneeze travels at about 100 mph.`,
        `The world's smallest mammal is the bumblebee bat, weighing less than a penny.`,
        `The first email was sent in 1971.`,
        `The Statue of Liberty was originally meant to be a lighthouse.`,
        `There’s enough gold in Earth’s core to cover the planet’s surface in a 1.5-foot layer.`,
        `The word "alphabet" comes from the first two letters of the Greek alphabet: Alpha & Beta.`,
        `A jellyfish’s body is 98% water.`,
        `Sloths can hold their breath longer than dolphins—up to 40 minutes!`,
        `The shortest war in history was between Britain and Zanzibar in 1896—it lasted 38 minutes.`,
      ];
      return funFacts[Math.floor(Math.random() * funFacts.length)];
    case 4:
      const coding = [
        "What’s the most useful algorithm every programmer should know?",
        "How do you approach debugging a complex bug in your code?",
        "What’s your favorite programming language and why?",
        "If you could remove one bad coding practice forever, what would it be?",
        "How do you keep up with new programming trends and technologies?",
        "What are some underrated tools that every developer should use?",
        "What’s a common mistake junior developers often make?",
        "How would you explain asynchronous programming to a beginner?",
        "What’s the most challenging coding problem you’ve ever solved?",
        "How do you handle technical debt in a long-term project?",
        "What’s the difference between functional programming and object-oriented programming?",
        "If you could redesign any programming language, what changes would you make?",
        "What’s the best way to write clean and maintainable code?",
        "What’s your most memorable coding mistake, and what did you learn from it?",
        "What are the benefits and drawbacks of using TypeScript over JavaScript?",
        "How would you explain Docker and containerization to a non-developer?",
        "What’s the most efficient way to learn a new programming language?",
        "How do you approach optimizing a slow database query?",
        "What’s your take on AI-generated code (e.g., Copilot, ChatGPT for coding)?",
        "How do you handle merge conflicts in Git when working with a team?",
        "What’s your go-to backend framework, and why?",
        "How do you ensure scalability when designing a backend system?",
        "What’s the best way to handle authentication and authorization in a web app?",
        "How do you optimize database queries for better performance?",
        "What’s the difference between monolithic and microservices architectures?",
        "How do you choose between SQL and NoSQL databases for a project?",
        "What’s the best way to implement caching to improve response times?",
        "How do you handle rate limiting in an API to prevent abuse?",
        "What are some best practices for designing RESTful APIs?",
        "How do you implement WebSockets for real-time communication?",
        "What’s the difference between synchronous and asynchronous processing?",
        "How do you handle background jobs and task scheduling efficiently?",
        "What’s the best way to manage environment variables and secrets in a backend application?",
        "How do you monitor and log errors in a production backend system?",
        "What’s the best approach to handle file uploads securely?",
        "How do you implement OAuth 2.0 and JWT for secure authentication?",
        "What are the biggest security risks in backend development, and how do you mitigate them?",
        "How do you handle API versioning in a long-term project?",
        "What are some challenges of integrating third-party APIs, and how do you solve them?",
        "How do you set up a CI/CD pipeline for a backend project?",
        "What’s your favorite frontend framework and why?",
        "How do you optimize a web page for better performance and loading speed?",
        "What’s the difference between SSR (Server-Side Rendering) and CSR (Client-Side Rendering)?",
        "How do you handle state management in a frontend application?",
        "What’s the best way to structure components in a large-scale Vue.js or React app?",
        "How do you ensure your web app is accessible (a11y) for all users?",
        "What’s the difference between CSS Grid and Flexbox, and when should you use each?",
        "How do you debug performance issues in a complex frontend application?",
        "What’s your approach to handling form validation in a frontend app?",
        "How do you handle responsive design for different screen sizes?",
        "What’s the best way to implement dark mode in a web application?",
        "How do you prevent CORS (Cross-Origin Resource Sharing) issues when calling an API?",
        "What are some common security vulnerabilities in frontend applications, and how do you mitigate them?",
        "How do you optimize image and asset loading for better performance?",
        "What’s the best way to handle internationalization (i18n) in a frontend app?",
        "How do you test frontend components using unit and integration testing?",
        "What’s the best approach to lazy loading and code splitting?",
        "How do you work with WebSockets in a frontend application?",
        "What are some best practices for writing maintainable CSS in a large project?",
        "How do you approach designing a progressive web app (PWA)?",
      ];
      return coding[Math.floor(Math.random() * coding.length)];
  
    }
}

function readPrivateKeys() {
  try {
    const data = fs.readFileSync(CONFIG.PRIVATE_KEY_FILE, 'utf8');
    const privateKeys = data
      .split('\n')
      .map(key => key.replace(/[\r\n]/g, '').trim())
      .filter(key => key !== '');
    
    if (privateKeys.length === 0) {
      log('Bạn chưa ném private key vào wallets.txt', 'error');
      process.exit(1);
    }
    
    log(`Đã đọc ${privateKeys.length} private key từ wallets.txt`, 'success');
    return privateKeys;
  } catch (error) {
    log(`Không thể đọc file wallets.txt: ${error}`, 'error');
    process.exit(1);
  }
}

function readProxies() {
  try {
    const data = fs.readFileSync(CONFIG.PROXY_FILE, 'utf8');
    const proxies = data.split('\n').filter(proxy => proxy.trim() !== '');
    
    if (proxies.length === 0) {
      log('Bạn chưa ném proxy vào proxies.txt', 'error');
      process.exit(1);
    }
    
    log(`Đã đọc ${proxies.length} proxy từ proxies.txt`, 'success');
    return proxies;
  } catch (error) {
    log(`Không thể đọc file proxies.txt: ${error}`, 'error');
    process.exit(1);
  }
}

async function checkProxyIP(proxy, accountIndex = null) {
  return await withRetry(
    async () => {
      const proxyAgent = new HttpsProxyAgent(proxy);
      const response = await axios.get('https://api.ipify.org?format=json', {
        httpsAgent: proxyAgent,
        timeout: 10000
      });
      
      if (response.status === 200) {
        return response.data.ip;
      } else {
        throw new Error(`Không thể kiểm tra IP của proxy. Status code: ${response.status}`);
      }
    },
    "Kiểm tra IP của proxy",
    accountIndex
  );
}

function createApiClient(sessionToken, proxy) {
  const proxyAgent = proxy ? new HttpsProxyAgent(proxy) : null;
  
  return axios.create({
    baseURL: CONFIG.API_BASE_URL,
    headers: {
      'x-session-token': sessionToken,
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'en-US,en;q=0.9',
      'origin': 'https://klokapp.ai',
      'referer': 'https://klokapp.ai/',
      'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0'
    },
    httpsAgent: proxyAgent,
    timeout: 30000
  });
}

async function verifyWallet(privateKey, proxy, accountIndex) {
  return await withRetry(
    async () => {
      const proxyAgent = proxy ? new HttpsProxyAgent(proxy) : null;
      const wallet = new ethers.Wallet(privateKey);
      const address = wallet.address;
      
      const currentDate = new Date();
      const timestamp = currentDate.toISOString();
      
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(48)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const message = `klokapp.ai wants you to sign in with your Ethereum account:\n${address}\n\n\nURI: https://klokapp.ai/\nVersion: 1\nChain ID: 1\nNonce: ${nonce}\nIssued At: ${timestamp}`;
      
      const signedMessage = await wallet.signMessage(message);
      
      const payload = {
        signedMessage: signedMessage,
        message: message,
        referral_code: "WNN5HT8C"
      };
      
      const response = await axios.post(`${CONFIG.API_BASE_URL}/verify`, payload, {
        headers: {
          'accept': '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'origin': 'https://klokapp.ai',
          'referer': 'https://klokapp.ai/',
          'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0'
        },
        httpsAgent: proxyAgent
      });
      
      return {
        success: true,
        address: address,
        sessionToken: response.data.session_token,
        userExists: response.data.user_exists
      };
    },
    "Xác thực ví",
    accountIndex
  );
}

async function checkRateLimit(apiClient, accountIndex) {
  return await withRetry(
    async () => {
      const response = await apiClient.get('/rate-limit');
      const rateData = response.data;
      
      if (rateData.remaining === 0) {
        const resetTimeMinutes = Math.ceil(rateData.reset_time / 60);
        return {
          hasRemaining: false,
          resetTime: rateData.reset_time,
          remaining: 0
        };
      }
      
      return {
        hasRemaining: true,
        resetTime: 0,
        remaining: rateData.remaining
      };
    },
    "Kiểm tra giới hạn",
    accountIndex
  );
}

async function getThreads(apiClient, accountIndex) {
  return await withRetry(
    async () => {
      const response = await apiClient.get('/threads');
      return response.data.data;
    },
    "Lấy danh sách cuộc trò chuyện",
    accountIndex
  );
}

async function createNewThread(apiClient, message, accountIndex) {
  return await withRetry(
    async () => {
      const threadId = uuidv4();
      const chatData = {
        id: threadId,
        title: "",
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        sources: [],
        model: "llama-3.3-70b-instruct",
        created_at: new Date().toISOString(),
        language: "english"
      };

      const response = await apiClient.post('/chat', chatData);
      log(`Cuộc trò chuyện mới được tạo thành công với ID: ${threadId}`, 'success');
      return { id: threadId };
    },
    "Tạo cuộc trò chuyện mới",
    accountIndex
  );
}

async function sendMessageToThread(apiClient, threadId, message, accountIndex) {
  return await withRetry(
    async () => {
      const chatData = {
        id: threadId,
        title: "",
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        sources: [],
        model: "llama-3.3-70b-instruct",
        created_at: new Date().toISOString(),
        language: "english"
      };

      const response = await apiClient.post('/chat', chatData);
      log(`Tin nhắn đã được gửi thành công tới cuộc trò chuyện: ${threadId}`, 'success');
      return response.data;
    },
    "Gửi tin nhắn",
    accountIndex
  );
}

async function checkPoints(apiClient, accountIndex, proxyIP = 'Unknown') {
  return await withRetry(
    async () => {
      const response = await apiClient.get('/points');
      const pointsData = response.data;
      
      log(`Tài khoản ${accountIndex + 1} | IP: ${proxyIP} | Points: ${pointsData.total_points || 0}`, 'custom');
      
      return pointsData;
    },
    "Kiểm tra điểm",
    accountIndex
  );
}

async function handleAccount(privateKey, proxy, accountIndex) {
  log(`Đang xử lý tài khoản ${accountIndex + 1}...`);
  
  let proxyIP = 'Unknown';
  try {
    proxyIP = await checkProxyIP(proxy, accountIndex);
    log(`Tài khoản ${accountIndex + 1}: Sử dụng proxy IP: ${proxyIP}`, 'success');
  } catch (error) {
    log(`Tài khoản ${accountIndex + 1}: Không thể kiểm tra IP của proxy sau ${CONFIG.MAX_RETRIES} lần thử: ${error.message}`, 'warning');
  }
  
  let verificationResult;
  try {
    verificationResult = await verifyWallet(privateKey, proxy, accountIndex);
  } catch (error) {
    log(`Tài khoản ${accountIndex + 1}: Lỗi xác thực ví sau ${CONFIG.MAX_RETRIES} lần thử: ${error.message}`, 'error');
    return {
      privateKey,
      proxy,
      proxyIP,
      apiClient: null,
      currentThreadId: null,
      accountIndex,
      rateLimited: true,
      resetTime: 0,
      failedAttempts: 0,
      hasError: true,
      points: 0,
      remainingChats: 0,
      walletAddress: null
    };
  }
  
  log(`Tài khoản ${accountIndex + 1}: Xác thực ví thành công. Địa chỉ: ${verificationResult.address}`, 'success');
  log(`Tài khoản ${accountIndex + 1}: Đã nhận session token: ${verificationResult.sessionToken}`, 'success');
  
  const apiClient = createApiClient(verificationResult.sessionToken, proxy);
  let currentThreadId = null;

  let pointsData;
  try {
    pointsData = await checkPoints(apiClient, accountIndex, proxyIP);
  } catch (error) {
    log(`Tài khoản ${accountIndex + 1}: Không thể kiểm tra điểm sau ${CONFIG.MAX_RETRIES} lần thử: ${error.message}`, 'warning');
    pointsData = { total_points: 0 };
  }
  
  let rateLimitInfo;
  try {
    rateLimitInfo = await checkRateLimit(apiClient, accountIndex);
  } catch (error) {
    log(`Tài khoản ${accountIndex + 1}: Không thể kiểm tra giới hạn rate limit sau ${CONFIG.MAX_RETRIES} lần thử: ${error.message}`, 'warning');
    rateLimitInfo = { hasRemaining: false, resetTime: 0, remaining: 0 };
  }
  
  if (!rateLimitInfo.hasRemaining) {
    return {
      privateKey,
      proxy,
      proxyIP,
      apiClient,
      currentThreadId: null,
      accountIndex,
      rateLimited: true,
      resetTime: rateLimitInfo.resetTime,
      failedAttempts: 0,
      points: pointsData?.total_points || 0,
      remainingChats: rateLimitInfo.remaining,
      walletAddress: verificationResult.address,
      sessionToken: verificationResult.sessionToken
    };
  }

  try {
    const threads = await getThreads(apiClient, accountIndex);
    if (threads.length > 0) {
      currentThreadId = threads[0].id;
      log(`Tài khoản ${accountIndex + 1}: Sử dụng cuộc trò chuyện đang có: ${currentThreadId}`, 'success');
    } else {
      const newThread = await createNewThread(apiClient, "Starting new conversation", accountIndex);
      if (newThread) {
        currentThreadId = newThread.id;
        log(`Tài khoản ${accountIndex + 1}: Bắt đầu cuộc trò chuyện mới: ${currentThreadId}`, 'success');
      }
    }
  } catch (error) {
    log(`Tài khoản ${accountIndex + 1}: Không thể lấy hoặc tạo cuộc trò chuyện sau ${CONFIG.MAX_RETRIES} lần thử: ${error.message}`, 'warning');
  }

  return {
    privateKey,
    proxy,
    proxyIP,
    apiClient,
    currentThreadId,
    accountIndex,
    rateLimited: false,
    resetTime: 0,
    failedAttempts: 0,
    lastRateLimitCheck: Date.now(),
    points: pointsData?.total_points || 0,
    remainingChats: rateLimitInfo.remaining,
    walletAddress: verificationResult.address,
    sessionToken: verificationResult.sessionToken
  };
}

async function runBot() {
  const privateKeys = readPrivateKeys();
  const proxies = readProxies();
  
  if (privateKeys.length >= proxies.length) {
    log(`Số lượng private key (${privateKeys.length}) và proxy (${proxies.length}) không khớp nhau. Vui lòng kiểm tra lại.`, 'error');
    process.exit(1);
  }
  
  const accounts = [];

  for (let i = 0; i < privateKeys.length; i++) {
    try {
      const account = await handleAccount(privateKeys[i], proxies[i], i);
      accounts.push(account);
    } catch (error) {
      log(`Lỗi xử lý tài khoản ${i + 1}: ${error.message}`, 'error');
      accounts.push({
        privateKey: privateKeys[i],
        proxy: proxies[i],
        proxyIP: 'Error',
        apiClient: null,
        currentThreadId: null,
        accountIndex: i,
        rateLimited: true,
        resetTime: 0,
        failedAttempts: 0,
        hasError: true,
        points: 0,
        remainingChats: 0,
        walletAddress: null
      });
    }
  }

  async function completeSocialTasks(apiClient, accountIndex, proxyIP = 'Unknown') {
    const socialTasks = ['twitter_klok', 'discord', 'twitter_mira'];
    
    for (const task of socialTasks) {
      try {
        const checkResponse = await withRetry(
          async () => {
            const response = await apiClient.get(`/points/action/${task}`);
            return response.data;
          },
          `Kiểm tra nhiệm vụ ${task}`,
          accountIndex
        );
        
        if (!checkResponse.has_completed) {
          const completeResponse = await withRetry(
            async () => {
              const response = await apiClient.post(`/points/action/${task}`);
              return response.data;
            },
            `Hoàn thành nhiệm vụ ${task}`,
            accountIndex
          );
          
          if (completeResponse.points_awarded) {
            log(`Tài khoản ${accountIndex + 1} | IP: ${proxyIP} | Làm nhiệm vụ ${task} thành công | nhận ${completeResponse.points_awarded} points`, 'success');
          } else {
            log(`Tài khoản ${accountIndex + 1} | IP: ${proxyIP} | Làm nhiệm vụ ${task} không nhận được points`, 'warning');
          }
        }
      } catch (error) {
        log(`Tài khoản ${accountIndex + 1} | IP: ${proxyIP} | Lỗi khi thực hiện nhiệm vụ ${task}: ${error.message}`, 'error');
      }
      
      await sleep(1000);
    }
  }

  async function processAccounts() {
    let allAccountsLimited = true;
    let minResetTime = 24 * 60 * 60;
    
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      
      if (account.hasError) {
        log(`Bỏ qua tài khoản ${account.accountIndex + 1} do lỗi trước đó`, 'warning');
        continue;
      }
      
      try {
        if (!account.sessionToken) {
          log(`Tài khoản ${account.accountIndex + 1}: Không có session token. Thử xác thực lại...`, 'warning');
          try {
            const verificationResult = await verifyWallet(account.privateKey, account.proxy, account.accountIndex);
            account.sessionToken = verificationResult.sessionToken;
            account.walletAddress = verificationResult.address;
          } catch (error) {
            log(`Tài khoản ${account.accountIndex + 1}: Không thể xác thực lại sau ${CONFIG.MAX_RETRIES} lần thử: ${error.message}`, 'error');
            account.hasError = true;
            continue;
          }
        }
        
        const apiClient = createApiClient(account.sessionToken, account.proxy);
        account.apiClient = apiClient;
        try {
          await completeSocialTasks(apiClient, account.accountIndex, account.proxyIP);
        } catch (taskError) {
          log(`Tài khoản ${account.accountIndex + 1}: Lỗi khi thực hiện các nhiệm vụ xã hội: ${taskError.message}`, 'warning');
        }
        let rateLimitInfo;
        try {
          rateLimitInfo = await checkRateLimit(account.apiClient, account.accountIndex);
          account.rateLimited = !rateLimitInfo.hasRemaining;
          account.resetTime = rateLimitInfo.resetTime;
          account.remainingChats = rateLimitInfo.remaining;
          account.lastRateLimitCheck = Date.now();
        } catch (error) {
          log(`Tài khoản ${account.accountIndex + 1}: Không thể kiểm tra giới hạn rate limit sau ${CONFIG.MAX_RETRIES} lần thử: ${error.message}`, 'warning');
          account.rateLimited = true;
          continue;
        }
        
        if (!account.rateLimited) {
          allAccountsLimited = false;
        } else if (account.resetTime > 0 && account.resetTime < minResetTime) {
          minResetTime = account.resetTime;
          continue;
        }
        
        if (account.rateLimited) {
          continue;
        }
        
        let pointsBefore;
        try {
          pointsBefore = await checkPoints(account.apiClient, account.accountIndex, account.proxyIP);
        } catch (error) {
          log(`Tài khoản ${account.accountIndex + 1}: Không thể kiểm tra điểm sau ${CONFIG.MAX_RETRIES} lần thử: ${error.message}`, 'warning');
          continue;
        }
        
        if (!pointsBefore || pointsBefore.total_points <= 0) {
          log(`Tài khoản ${account.accountIndex + 1}: Không có điểm nào...`, 'warning');
          continue;
        }
        
        account.points = pointsBefore.total_points;
        
        if (!account.currentThreadId) {
          log(`Tài khoản ${account.accountIndex + 1}: Không có cuộc trò chuyện nào hoạt động có sẵn. Tạo cuộc trò chuyện mới...`, 'warning');
          try {
            const newThread = await createNewThread(account.apiClient, "Starting new conversation", account.accountIndex);
            if (newThread) {
              account.currentThreadId = newThread.id;
              account.failedAttempts = 0; 
            } else {
              continue;
            }
          } catch (error) {
            log(`Tài khoản ${account.accountIndex + 1}: Không thể tạo cuộc trò chuyện mới sau ${CONFIG.MAX_RETRIES} lần thử: ${error.message}`, 'warning');
            continue;
          }
        }
  
        const message = getRandomMessage();
        log(`Tài khoản ${account.accountIndex + 1}: Gửi tin nhắn: "${message}"`, 'info');
        
        let result;
        try {
          result = await sendMessageToThread(account.apiClient, account.currentThreadId, message, account.accountIndex);
        } catch (error) {
          log(`Tài khoản ${account.accountIndex + 1}: Không thể gửi tin nhắn sau ${CONFIG.MAX_RETRIES} lần thử: ${error.message}`, 'warning');
          account.failedAttempts++;
          
          if (account.failedAttempts >= CONFIG.MAX_FAILED_ATTEMPTS) {
            log(`Tài khoản ${account.accountIndex + 1}: Đã bị bot bơ ${CONFIG.MAX_FAILED_ATTEMPTS} lần liên tiếp. Tạo cuộc trò chuyện mới.`, 'warning');
            account.currentThreadId = null;
            account.failedAttempts = 0;
          }
          
          continue;
        }
        
        let rateLimitAfter;
        try {
          rateLimitAfter = await checkRateLimit(account.apiClient, account.accountIndex);
          account.remainingChats = rateLimitAfter.remaining;
        } catch (error) {
          log(`Tài khoản ${account.accountIndex + 1}: Không thể kiểm tra rate limit sau gửi tin nhắn: ${error.message}`, 'warning');
        }
        
        let pointsAfter;
        try {
          pointsAfter = await checkPoints(account.apiClient, account.accountIndex, account.proxyIP);
        } catch (error) {
          log(`Tài khoản ${account.accountIndex + 1}: Không thể kiểm tra điểm sau gửi tin nhắn: ${error.message}`, 'warning');
          continue;
        }
        
        if (!result) {
          account.failedAttempts++;
          log(`Tài khoản ${account.accountIndex + 1}: Không có phản hồi. Bot ko thèm rep lần ${account.failedAttempts}/${CONFIG.MAX_FAILED_ATTEMPTS}`, 'warning');
          
          if (account.failedAttempts >= CONFIG.MAX_FAILED_ATTEMPTS) {
            log(`Tài khoản ${account.accountIndex + 1}: Đã bị bot bơ ${CONFIG.MAX_FAILED_ATTEMPTS} lần liên tiếp. Tạo cuộc trò chuyện mới.`, 'warning');
            account.currentThreadId = null;
            account.failedAttempts = 0;
          }
        } else {
          if (pointsAfter && pointsBefore && pointsAfter.total_points <= pointsBefore.total_points) {
            log(`Tài khoản ${account.accountIndex + 1}: Điểm không tăng sau khi gửi tin nhắn. Tạo cuộc trò chuyện mới.`, 'warning');
            account.currentThreadId = null;
          } else {
            log(`Tài khoản ${account.accountIndex + 1}: Nhận phản hồi thành công. Điểm hiện tại: ${pointsAfter ? pointsAfter.total_points : 'Unknown'}`, 'success');
            account.failedAttempts = 0;
            account.points = pointsAfter ? pointsAfter.total_points : account.points;
          }
        }
      } catch (error) {
        log(`Lỗi xử lý tài khoản ${account.accountIndex + 1}: ${error.message}`, 'error');
        try {
          account.proxyIP = await checkProxyIP(account.proxy, account.accountIndex);
          log(`Tài khoản ${account.accountIndex + 1}: Làm mới proxy IP: ${account.proxyIP}`, 'success');
        } catch (proxyError) {
          log(`Tài khoản ${account.accountIndex + 1}: Proxy có thể bị lỗi sau ${CONFIG.MAX_RETRIES} lần thử: ${proxyError.message}`, 'warning');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  
    if (allAccountsLimited) {
      log("Tất cả tài khoản đều đã đạt giới hạn. Đợi một thời gian trước khi thử lại.", 'warning');
      
      if (minResetTime < 24 * 60 * 60 && minResetTime > 0) {
        log(`Đợi ${Math.ceil(minResetTime / 60)} phút cho đến khi rate limit được reset...`, 'custom');
        await countdown(minResetTime);
      } else {
        log("Đợi 24 giờ trước khi thử lại...", 'custom');
        const waitSeconds = 86400;
        await countdown(waitSeconds);
      }
    } else {
      const nextInterval = 5000;
      log(`Cuộc trò chuyện tiếp theo sẽ diễn ra trong ${nextInterval/1000} giây`, 'info');
      await countdown(nextInterval/1000);
    }
    
    processAccounts();
  }

  processAccounts();
}

runBot().catch(error => {
  log(`Bot crashed: ${error}`, 'error');
  process.exit(1);
});
