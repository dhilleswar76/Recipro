import { z } from 'zod';

// ============================================================
// GEMINI AI SERVICE & STRUCTURED SCHEMAS
// ============================================================

export const AssessmentQuestionOptionSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
});

export const AssessmentQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(5),
  codeSnippet: z.string().optional(),
  options: z.array(AssessmentQuestionOptionSchema).length(4),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(5),
  hint: z.string().optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).default('Intermediate'),
});

export const GeneratedQuizSchema = z.object({
  assessmentVersion: z.string().default('v1.0'),
  skill: z.literal('Python').or(z.string()),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  provider: z.enum(['GEMINI_AI', 'LOCAL_FALLBACK']).default('GEMINI_AI'),
  questions: z.array(AssessmentQuestionSchema).min(5).max(20),
});

export type GeneratedQuiz = z.infer<typeof GeneratedQuizSchema>;
export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;

export const RoadmapStageSchema = z.object({
  order: z.number().int().optional(),
  stage: z.number().int().optional(),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  skillQuery: z.string().optional(),
  estimatedHours: z.number().optional().default(5),
  objectives: z.array(z.string()).optional().default([]),
  topics: z.array(z.string()).optional().default([]),
  practiceTasks: z.array(z.string()).optional().default([]),
  completionCriteria: z.array(z.string()).optional().default([]),
}).transform((st) => ({
  order: st.order ?? st.stage ?? 1,
  title: st.title,
  description: st.description || `Core concepts and practical application of ${st.title}.`,
  skillQuery: st.skillQuery || st.title.split(' ')[0] || 'Python',
  estimatedHours: st.estimatedHours || 5,
  objectives: st.objectives && st.objectives.length > 0 ? st.objectives : (st.topics && st.topics.length > 0 ? st.topics : ['Master core principles']),
  practiceTasks: st.practiceTasks && st.practiceTasks.length > 0 ? st.practiceTasks : ['Complete hands-on coding exercises'],
  completionCriteria: st.completionCriteria && st.completionCriteria.length > 0 ? st.completionCriteria : ['Complete stage review and code verification'],
}));

export const GeneratedRoadmapSchema = z.object({
  title: z.string().min(1),
  goal: z.string().optional(),
  estimatedDuration: z.string().optional().default('6 weeks'),
  provider: z.enum(['GEMINI_AI', 'LOCAL_FALLBACK']).optional().default('GEMINI_AI'),
  stages: z.array(RoadmapStageSchema).optional(),
  roadmap: z.array(RoadmapStageSchema).optional(),
}).transform((rdm) => ({
  title: rdm.title,
  goal: rdm.goal || rdm.title,
  estimatedDuration: rdm.estimatedDuration || '6 weeks',
  provider: rdm.provider || 'GEMINI_AI',
  stages: (rdm.stages && rdm.stages.length > 0 ? rdm.stages : (rdm.roadmap || [])),
}));

export type GeneratedRoadmap = z.infer<typeof GeneratedRoadmapSchema>;
export type RoadmapStage = z.infer<typeof RoadmapStageSchema>;

// ============================================================
// CURATED LOCAL FALLBACK DATA (WHEN GEMINI API KEY IS ABSENT)
// ============================================================

export const LOCAL_PYTHON_QUIZ_BANK: Record<string, AssessmentQuestion[]> = {
  'Beginner': [
    {
      id: 'py-b-1',
      question: 'What is the correct syntax to output "Hello, World" in Python 3?',
      options: [
        { id: 'A', text: 'echo("Hello, World")' },
        { id: 'B', text: 'print("Hello, World")' },
        { id: 'C', text: 'p("Hello, World")' },
        { id: 'D', text: 'Console.WriteLine("Hello, World")' },
      ],
      correctOption: 'B',
      explanation: 'In Python 3, print is a built-in function that takes arguments in parentheses.',
      hint: 'Think about standard output functions in Python 3.',
      level: 'Beginner',
    },
    {
      id: 'py-b-2',
      question: 'Which data type is immutable in Python?',
      options: [
        { id: 'A', text: 'list' },
        { id: 'B', text: 'dict' },
        { id: 'C', text: 'tuple' },
        { id: 'D', text: 'set' },
      ],
      correctOption: 'C',
      explanation: 'Tuples cannot be modified after creation, making them immutable sequence types.',
      hint: 'Consider which sequence type cannot be modified in-place.',
      level: 'Beginner',
    },
    {
      id: 'py-b-3',
      question: 'How do you create a function in Python?',
      options: [
        { id: 'A', text: 'function myFunc():' },
        { id: 'B', text: 'def myFunc():' },
        { id: 'C', text: 'create myFunc():' },
        { id: 'D', text: 'fn myFunc():' },
      ],
      correctOption: 'B',
      explanation: 'The def keyword begins a function definition in Python.',
      hint: 'The keyword is a 3-letter abbreviation.',
      level: 'Beginner',
    },
    {
      id: 'py-b-4',
      question: 'What operator is used for floor division in Python?',
      options: [
        { id: 'A', text: '/' },
        { id: 'B', text: '//' },
        { id: 'C', text: '%' },
        { id: 'D', text: '**' },
      ],
      correctOption: 'B',
      explanation: '// performs integer division and truncates the decimal part towards negative infinity.',
      hint: 'It uses double slashes.',
      level: 'Beginner',
    },
    {
      id: 'py-b-5',
      question: 'How do you add an element to the end of a list named `items`?',
      options: [
        { id: 'A', text: 'items.push(val)' },
        { id: 'B', text: 'items.add(val)' },
        { id: 'C', text: 'items.append(val)' },
        { id: 'D', text: 'items.insert_end(val)' },
      ],
      correctOption: 'C',
      explanation: 'The append() method appends an element to the end of a Python list.',
      hint: 'The method starts with "app".',
      level: 'Beginner',
    },
  ],

  'Intermediate': [
    {
      id: 'py-i-1',
      question: 'What is the output of `[x**2 for x in range(5) if x % 2 == 0]`?',
      options: [
        { id: 'A', text: '[0, 4, 16]' },
        { id: 'B', text: '[0, 1, 4, 9, 16]' },
        { id: 'C', text: '[1, 9]' },
        { id: 'D', text: '[4, 16]' },
      ],
      correctOption: 'A',
      explanation: 'range(5) produces 0, 1, 2, 3, 4. Even numbers are 0, 2, 4, and their squares are 0, 4, 16.',
      hint: 'Filter even numbers first (0, 2, 4), then square them.',
      level: 'Intermediate',
    },
    {
      id: 'py-i-2',
      question: 'What is the primary purpose of the `*args` and `**kwargs` parameters?',
      options: [
        { id: 'A', text: 'To specify type annotations for integer arguments' },
        { id: 'B', text: 'To accept a variable number of positional and keyword arguments' },
        { id: 'C', text: 'To enforce strict memory pointers in CPython' },
        { id: 'D', text: 'To define asynchronous concurrency threads' },
      ],
      correctOption: 'B',
      explanation: '*args captures extra positional arguments as a tuple, and **kwargs captures keyword arguments as a dictionary.',
      hint: 'Variable length arguments unpacking.',
      level: 'Intermediate',
    },
    {
      id: 'py-i-3',
      question: 'What does the `yield` keyword do when used inside a Python function?',
      options: [
        { id: 'A', text: 'Terminates the program immediately with an exit code' },
        { id: 'B', text: 'Suspends the function and turns it into a generator that produces a value' },
        { id: 'C', text: 'Allocates heap memory for C-extensions' },
        { id: 'D', text: 'Raises an unhandled exception' },
      ],
      correctOption: 'B',
      explanation: 'yield produces a generator iterator that preserves local state across next() invocations.',
      hint: 'Generators and lazy evaluation.',
      level: 'Intermediate',
    },
    {
      id: 'py-i-4',
      question: 'How do you correctly open a file in Python ensuring it is automatically closed?',
      options: [
        { id: 'A', text: 'open("file.txt", "r").autoclose()' },
        { id: 'B', text: 'with open("file.txt", "r") as f:' },
        { id: 'C', text: 'file = File.open("file.txt")' },
        { id: 'D', text: 'using open("file.txt") as f:' },
      ],
      correctOption: 'B',
      explanation: 'The `with` statement utilizes the context manager protocol (__enter__ and __exit__) to reliably close resources.',
      hint: 'Python context manager statement.',
      level: 'Intermediate',
    },
    {
      id: 'py-i-5',
      question: 'What is the difference between `==` and `is` in Python?',
      options: [
        { id: 'A', text: 'There is no difference' },
        { id: 'B', text: '`==` compares value equality; `is` compares memory identity/object reference' },
        { id: 'C', text: '`is` is used for mathematical formulas; `==` for strings' },
        { id: 'D', text: '`==` is deprecated in Python 3' },
      ],
      correctOption: 'B',
      explanation: '`==` checks if values are equal (invoking __eq__), while `is` tests whether two references point to the exact same object in memory.',
      hint: 'Value vs Identity.',
      level: 'Intermediate',
    },
  ],

  'Advanced': [
    {
      id: 'py-a-1',
      question: 'What is the Global Interpreter Lock (GIL) in CPython?',
      options: [
        { id: 'A', text: 'A security lock that encrypts Python scripts on disk' },
        { id: 'B', text: 'A mutex that prevents multiple native threads from executing Python bytecode simultaneously' },
        { id: 'C', text: 'A database locking mechanism for SQLite' },
        { id: 'D', text: 'A compiler flag for JIT optimization' },
      ],
      correctOption: 'B',
      explanation: 'CPython uses the GIL to ensure thread safety for reference counting memory management.',
      hint: 'Threading synchronization mechanism in CPython.',
      level: 'Advanced',
    },
    {
      id: 'py-a-2',
      question: 'In Python decorators, why is `functools.wraps` commonly applied to the wrapper function?',
      options: [
        { id: 'A', text: 'To speed up execution with cython' },
        { id: 'B', text: 'To preserve the original function metadata like __name__, __doc__, and signature' },
        { id: 'C', text: 'To prevent recursive stack overflows' },
        { id: 'D', text: 'To enforce async await execution' },
      ],
      correctOption: 'B',
      explanation: 'functools.wraps copies the docstring, function name, and signature from the decorated function to the wrapper.',
      hint: 'Metadata preservation in higher order functions.',
      level: 'Advanced',
    },
    {
      id: 'py-a-3',
      question: 'What is the difference between `__new__` and `__init__` in Python OOP?',
      options: [
        { id: 'A', text: '`__new__` creates the instance; `__init__` initializes the created instance' },
        { id: 'B', text: '`__init__` is for classes; `__new__` is for modules' },
        { id: 'C', text: '`__new__` is only available in Python 2' },
        { id: 'D', text: 'They are identical aliases' },
      ],
      correctOption: 'A',
      explanation: '__new__ is the static allocator method that returns a new instance, which is then passed to __init__ for attribute initialization.',
      hint: 'Instance creation vs Initialization.',
      level: 'Advanced',
    },
    {
      id: 'py-a-4',
      question: 'What happens when you pass a mutable object (like a list) as a default parameter in a function definition?',
      options: [
        { id: 'A', text: 'A new empty list is created every time the function is called' },
        { id: 'B', text: 'The default list is evaluated once at definition time and shared across all calls' },
        { id: 'C', text: 'Python raises a TypeError at runtime' },
        { id: 'D', text: 'The list is frozen into an immutable tuple' },
      ],
      correctOption: 'B',
      explanation: 'Default argument values in Python are evaluated once when the function is defined, causing mutable defaults to persist mutations across calls.',
      hint: 'Evaluation at function definition time vs call time.',
      level: 'Advanced',
    },
    {
      id: 'py-a-5',
      question: 'In Python `asyncio`, what does `asyncio.gather(*tasks)` do?',
      options: [
        { id: 'A', text: 'Executes tasks sequentially in separate OS processes' },
        { id: 'B', text: 'Runs awaitable objects concurrently on the event loop and returns an aggregated list of results' },
        { id: 'C', text: 'Compiles coroutines to WebAssembly' },
        { id: 'D', text: 'Stops the event loop' },
      ],
      correctOption: 'B',
      explanation: 'asyncio.gather schedules multiple coroutines concurrently and collects their results in order upon completion.',
      hint: 'Concurrent task execution on the event loop.',
      level: 'Advanced',
    },
  ],

  'Expert': [
    {
      id: 'py-e-1',
      question: 'What is the Method Resolution Order (MRO) algorithm used in Python 3 for multiple inheritance?',
      options: [
        { id: 'A', text: 'Depth-First Search (DFS)' },
        { id: 'B', text: 'C3 Linearization' },
        { id: 'C', text: 'Dijkstra Shortest Path' },
        { id: 'D', text: 'Breadth-First Search (BFS)' },
      ],
      correctOption: 'B',
      explanation: 'Python uses the C3 Linearization algorithm to determine class inheritance linearization and avoid monotonicity violations.',
      hint: 'C3 algorithm.',
      level: 'Expert',
    },
    {
      id: 'py-e-2',
      question: 'What is the primary memory optimization achieved by declaring `__slots__` on a class?',
      options: [
        { id: 'A', text: 'Enables CPU vectorization' },
        { id: 'B', text: 'Prevents the creation of dynamic `__dict__` per instance, reducing memory overhead significantly' },
        { id: 'C', text: 'Converts the class into a C struct automatically' },
        { id: 'D', text: 'Forces garbage collection after each method call' },
      ],
      correctOption: 'B',
      explanation: '__slots__ reserves space for a fixed set of attributes and omits the dynamic instance dictionary, saving considerable RAM.',
      hint: 'Instance dictionary suppression.',
      level: 'Expert',
    },
    {
      id: 'py-e-3',
      question: 'How does Python garbage collection handle cyclic reference graphs between objects?',
      options: [
        { id: 'A', text: 'Reference counting alone frees them immediately' },
        { id: 'B', text: 'A generational cyclic garbage collector periodically tracks and cleans unreachable container cycles' },
        { id: 'C', text: 'Cycles cause permanent memory leaks that cannot be collected' },
        { id: 'D', text: 'Cycles are prevented by the compiler' },
      ],
      correctOption: 'B',
      explanation: 'While reference counting handles linear lifecycles, Python includes a 3-generation cyclic GC (gc module) that detects unreachable reference loops.',
      hint: 'Generational cyclic garbage collector.',
      level: 'Expert',
    },
    {
      id: 'py-e-4',
      question: 'What is a metaclass in Python, and what is its default type?',
      options: [
        { id: 'A', text: 'A function that compiles bytecode; default is `object`' },
        { id: 'B', text: 'A class whose instances are classes; default is `type`' },
        { id: 'C', text: 'A C++ header bridge; default is `ctypes`' },
        { id: 'D', text: 'A decorator factory; default is `Callable`' },
      ],
      correctOption: 'B',
      explanation: 'In Python, classes are themselves instances of metaclasses. The default metaclass that constructs classes is `type`.',
      hint: 'Classes are instances of `type`.',
      level: 'Expert',
    },
    {
      id: 'py-e-5',
      question: 'In the Python descriptor protocol, what constitutes a "Data Descriptor"?',
      options: [
        { id: 'A', text: 'A descriptor that only defines `__get__`' },
        { id: 'B', text: 'A descriptor that defines `__set__` or `__delete__` (in addition to `__get__`)' },
        { id: 'C', text: 'A database ORM model' },
        { id: 'D', text: 'A typed dataclass decorator' },
      ],
      correctOption: 'B',
      explanation: 'A data descriptor defines __set__ or __delete__. Unlike non-data descriptors, data descriptors take precedence over an instance dictionary during attribute lookup.',
      hint: 'Defines __set__ or __delete__.',
      level: 'Expert',
    },
  ],
};

// ============================================================
// GEMINI SERVER-SIDE API CALLS & PROMPT INJECTION ISOLATION
// ============================================================

export async function generatePythonQuiz(params: {
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  questionCount?: number;
}): Promise<GeneratedQuiz> {
  const count = params.questionCount || 10;
  const level = params.proficiency || 'Intermediate';

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const model = process.env.GEMINI_MODEL || process.env.AI_MODEL_NAME || 'gemini-1.5-flash';

  // If no Gemini API key configured, use curated local question bank
  if (!apiKey || apiKey.trim() === '') {
    console.log(`[AI Provider: LOCAL_FALLBACK] Gemini API key not provided. Serving curated ${level} Python assessment bank.`);
    const bank = LOCAL_PYTHON_QUIZ_BANK[level] || LOCAL_PYTHON_QUIZ_BANK['Intermediate'];
    return {
      assessmentVersion: 'v1.0-curated',
      skill: 'Python',
      difficulty: level,
      provider: 'LOCAL_FALLBACK',
      questions: bank.slice(0, count),
    };
  }

  try {
    const systemInstruction = `You are an expert Python compiler and curriculum examiner for university computer science students.
Generate an objective, strictly accurate multiple-choice skill assessment for Python Programming.
Rules:
1. Target Difficulty Level: ${level}.
2. Exactly ${count} questions.
3. Every question must have exactly 4 choices (labeled A, B, C, D) and exactly ONE correct answer.
4. Provide a clear, technical explanation and a hint.
5. Strict structured JSON output following the schema provided. No conversational preamble.`;

    const userPrompt = `Generate a ${count}-question Python assessment for the "${level}" proficiency tier. Output pure JSON adhering to the specified schema.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[Gemini API Error] Status: ${response.status}. Falling back to curated question bank.`);
      const bank = LOCAL_PYTHON_QUIZ_BANK[level] || LOCAL_PYTHON_QUIZ_BANK['Intermediate'];
      return {
        assessmentVersion: 'v1.0-fallback',
        skill: 'Python',
        difficulty: level,
        provider: 'LOCAL_FALLBACK',
        questions: bank.slice(0, count),
      };
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Empty Gemini response');
    }

    const parsedJson = JSON.parse(rawText);
    const validated = GeneratedQuizSchema.safeParse(parsedJson);

    if (validated.success) {
      return {
        ...validated.data,
        provider: 'GEMINI_AI',
      };
    } else {
      console.warn('[Gemini Schema Mismatch] Falling back to curated bank:', validated.error);
      const bank = LOCAL_PYTHON_QUIZ_BANK[level] || LOCAL_PYTHON_QUIZ_BANK['Intermediate'];
      return {
        assessmentVersion: 'v1.0-fallback',
        skill: 'Python',
        difficulty: level,
        provider: 'LOCAL_FALLBACK',
        questions: bank.slice(0, count),
      };
    }
  } catch (err) {
    console.error('[Gemini Request Exception] Fallback activated:', err);
    const bank = LOCAL_PYTHON_QUIZ_BANK[level] || LOCAL_PYTHON_QUIZ_BANK['Intermediate'];
    return {
      assessmentVersion: 'v1.0-fallback',
      skill: 'Python',
      difficulty: level,
      provider: 'LOCAL_FALLBACK',
      questions: bank.slice(0, count),
    };
  }
}

// ============================================================
// STUDY COACH ROADMAP GENERATOR
// ============================================================

export const LOCAL_CURRICULUM_ROADMAPS: Record<string, GeneratedRoadmap> = {
  'python': {
    title: 'Python for Data Science & Machine Learning',
    goal: 'Master Python core syntax, scientific computing with Pandas/NumPy, and ML model training',
    estimatedDuration: '8 weeks',
    provider: 'LOCAL_FALLBACK',
    stages: [
      {
        order: 1,
        title: 'Python Fundamentals & Idiomatic Coding',
        description: 'Master core control flow, data structures, list comprehensions, and functions.',
        skillQuery: 'Python',
        estimatedHours: 6,
        objectives: ['Variables and type casting', 'Loops, conditionals, and comprehensions', 'File I/O and exception handling'],
        practiceTasks: ['Build a CLI task manager', 'Parse and aggregate CSV datasets'],
        completionCriteria: ['Code clean, PEP-8 compliant scripts without syntax errors'],
      },
      {
        order: 2,
        title: 'Data Structures & OOP in Python',
        description: 'Design modular classes, understand inheritance, magic methods, and custom decorators.',
        skillQuery: 'Data Structures',
        estimatedHours: 8,
        objectives: ['Object-Oriented Programming (OOP)', 'Stack, Queue, and Tree implementations', 'Custom decorators and context managers'],
        practiceTasks: ['Implement an LRU cache class', 'Build a custom timer context manager'],
        completionCriteria: ['Pass unit tests verifying custom data structure invariants'],
      },
      {
        order: 3,
        title: 'Scientific Computing with NumPy & Pandas',
        description: 'Perform vectorized matrix calculations and high-performance tabular data wrangling.',
        skillQuery: 'Python',
        estimatedHours: 10,
        objectives: ['NumPy ndarrays, broadcasting, and linear algebra', 'Pandas DataFrame grouping, merging, and indexing', 'Data cleaning and handling missing values'],
        practiceTasks: ['Analyze a 100,000-row campus dataset', 'Compute statistical covariance and correlation matrices'],
        completionCriteria: ['Produce clean, aggregated summary metrics from raw tabular datasets'],
      },
      {
        order: 4,
        title: 'Data Visualization & Exploratory Analysis',
        description: 'Communicate visual insights with Matplotlib, Seaborn, and interactive dashboards.',
        skillQuery: 'Python',
        estimatedHours: 6,
        objectives: ['Histograms, scatter plots, and box plots', 'Custom visual styling and color palettes', 'Exploratory Data Analysis (EDA) storytelling'],
        practiceTasks: ['Generate a multi-panel exploratory analysis dashboard', 'Identify statistical distribution anomalies'],
        completionCriteria: ['Present a complete EDA report answering specific domain questions'],
      },
      {
        order: 5,
        title: 'Machine Learning Foundations (Scikit-Learn)',
        description: 'Train supervised classification and regression models, evaluating accuracy and precision.',
        skillQuery: 'Machine Learning',
        estimatedHours: 12,
        objectives: ['Train-test split and cross-validation', 'Linear Regression, Logistic Regression, and Decision Trees', 'Confusion matrix, precision, recall, and ROC-AUC evaluation'],
        practiceTasks: ['Train a student grade prediction model', 'Perform hyperparameter tuning with GridSearchCV'],
        completionCriteria: ['Achieve >85% cross-validated model accuracy on unseen test data'],
      },
    ],
  },
  'solidity': {
    title: 'Solidity Smart Contract Engineering',
    goal: 'Design, test, and deploy secure EVM smart contracts, token standards, and escrow protocols',
    estimatedDuration: '6 weeks',
    provider: 'LOCAL_FALLBACK',
    stages: [
      {
        order: 1,
        title: 'Blockchain & Ethereum Virtual Machine (EVM)',
        description: 'Understand state transitions, accounts, gas mechanics, and consensus fundamentals.',
        skillQuery: 'Solidity',
        estimatedHours: 6,
        objectives: ['EVM execution model', 'Gas optimization principles', 'Accounts vs Contract addresses'],
        practiceTasks: ['Calculate transaction gas costs', 'Inspect block headers on Etherscan'],
        completionCriteria: ['Explain state transition lifecycle and gas calculation accurately'],
      },
      {
        order: 2,
        title: 'Solidity Syntax, Types & State Variables',
        description: 'Write clean contracts using structs, mappings, view/pure modifiers, and custom errors.',
        skillQuery: 'Solidity',
        estimatedHours: 8,
        objectives: ['Storage vs Memory vs Calldata', 'Mappings and dynamic arrays', 'Events and custom error handlers'],
        practiceTasks: ['Implement an on-chain student registry contract', 'Emit events for contract state updates'],
        completionCriteria: ['Compile contracts with zero compiler warnings'],
      },
      {
        order: 3,
        title: 'Token Standards (ERC-20 & ERC-721)',
        description: 'Implement fungible tokens and verifiable credential NFTs using OpenZeppelin standards.',
        skillQuery: 'Solidity',
        estimatedHours: 8,
        objectives: ['ERC-20 tokenomics & allowance patterns', 'ERC-721 non-fungible & soulbound credentials', 'Safe transfers and metadata URIs'],
        practiceTasks: ['Deploy a campus skill credit token', 'Mint a Soulbound Skill Certificate NFT'],
        completionCriteria: ['Pass standard ERC compliance verification tests'],
      },
      {
        order: 4,
        title: 'Security Auditing & Hardhat Testing',
        description: 'Prevent reentrancy attacks, integer overflow, and implement Checks-Effects-Interactions pattern.',
        skillQuery: 'Solidity',
        estimatedHours: 10,
        objectives: ['Reentrancy guards and access control', 'Checks-Effects-Interactions invariant', 'Unit testing and fork simulations with Hardhat/Foundry'],
        practiceTasks: ['Audit and patch a deliberately vulnerable escrow contract', 'Write 100% code coverage test suite'],
        completionCriteria: ['Prevent reentrancy and unauthorized privilege escalation in audit suite'],
      },
    ],
  },
};

export async function generateStudyRoadmap(params: {
  goal: string;
  currentLevel?: string;
  targetLevel?: string;
  weeklyHours?: number;
}): Promise<GeneratedRoadmap> {
  const goal = (params.goal || 'Python Programming').trim();
  const currentLevel = params.currentLevel || 'Beginner';
  const targetLevel = params.targetLevel || 'Intermediate';
  const weeklyHours = params.weeklyHours || 6;

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const model = process.env.GEMINI_MODEL || process.env.AI_MODEL_NAME || 'gemini-1.5-flash';

  const lowerGoal = goal.toLowerCase();

  // If no API key configured, fallback to curated roadmaps if available or throw configuration error
  if (!apiKey || apiKey.trim() === '') {
    if (lowerGoal.includes('solidity') || lowerGoal.includes('web3') || lowerGoal.includes('blockchain')) {
      return LOCAL_CURRICULUM_ROADMAPS['solidity'];
    }
    return LOCAL_CURRICULUM_ROADMAPS['python'];
  }

  try {
    const systemInstruction = `You are a principal university curriculum designer and AI Study Coach.
Generate a structured, step-by-step learning roadmap in JSON format matching the following schema:
{
  "title": "Clear Roadmap Title",
  "goal": "Student learning goal",
  "estimatedDuration": "8 weeks",
  "stages": [
    {
      "order": 1,
      "title": "Stage Title",
      "description": "Comprehensive explanation of what is learned in this stage",
      "skillQuery": "Specific skill name to search in mentor catalog (e.g. Python, React, Solidity, Data Structures)",
      "estimatedHours": 6,
      "objectives": ["Specific objective 1", "Specific objective 2"],
      "practiceTasks": ["Actionable practice task 1", "Actionable practice task 2"],
      "completionCriteria": ["Clear verification metric"]
    }
  ]
}
Output strictly valid JSON with 4 to 6 stages. Do not include markdown code blocks or conversational text.`;

    const userPrompt = `Student Goal: "${goal}"
Current Proficiency: ${currentLevel}
Target Proficiency: ${targetLevel}
Available Study Time: ${weeklyHours} hours per week`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          { role: 'user', parts: [{ text: userPrompt }] }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[Gemini API Roadmap Error] Status: ${response.status}. Serving curated curriculum.`);
      return lowerGoal.includes('solidity') ? LOCAL_CURRICULUM_ROADMAPS['solidity'] : LOCAL_CURRICULUM_ROADMAPS['python'];
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty Gemini roadmap text');

    const parsedJson = JSON.parse(rawText);
    const validated = GeneratedRoadmapSchema.safeParse(parsedJson);

    if (validated.success) {
      return {
        ...validated.data,
        provider: 'GEMINI_AI',
      };
    } else {
      console.warn('[Gemini Roadmap Schema Mismatch] Falling back to local curriculum:', validated.error);
      return lowerGoal.includes('solidity') ? LOCAL_CURRICULUM_ROADMAPS['solidity'] : LOCAL_CURRICULUM_ROADMAPS['python'];
    }
  } catch (err) {
    console.error('[Gemini Roadmap Request Exception] Fallback activated:', err);
    return lowerGoal.includes('solidity') ? LOCAL_CURRICULUM_ROADMAPS['solidity'] : LOCAL_CURRICULUM_ROADMAPS['python'];
  }
}

// ============================================================
// CLIENT SANITIZATION HELPER (PREVENTS ANSWER LEAKAGE)
// ============================================================

export function sanitizeAssessmentForClient(quiz: GeneratedQuiz) {
  return {
    assessmentVersion: quiz.assessmentVersion,
    skill: quiz.skill,
    difficulty: quiz.difficulty,
    provider: quiz.provider,
    questionsCount: quiz.questions.length,
    questions: quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      codeSnippet: q.codeSnippet,
      options: q.options,
      hint: q.hint,
      level: q.level,
      // CRITICAL SECURITY: correctOption and explanation are NEVER included here!
    })),
  };
}
