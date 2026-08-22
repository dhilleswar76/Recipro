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

export const LOCAL_SKILL_QUIZ_BANKS: Record<string, AssessmentQuestion[]> = {
  'solidity': [
    {
      id: 'sol-1',
      question: 'Which design pattern is essential to protect against Reentrancy attacks in Solidity?',
      options: [
        { id: 'A', text: 'Interactions-Effects-Checks' },
        { id: 'B', text: 'Checks-Effects-Interactions' },
        { id: 'C', text: 'Delegatecall Proxy Pattern' },
        { id: 'D', text: 'Factory Contract Pattern' },
      ],
      correctOption: 'B',
      explanation: 'Checks-Effects-Interactions ensures state variables (such as user balances) are modified before external calls.',
      hint: 'Modify state before making external transfer calls.',
      level: 'Intermediate',
    },
    {
      id: 'sol-2',
      question: 'What is the difference between `memory` and `calldata` in Solidity function arguments?',
      options: [
        { id: 'A', text: '`calldata` is non-modifiable, read-only and cheaper gas-wise for external functions' },
        { id: 'B', text: '`memory` is permanently stored on the blockchain ledger' },
        { id: 'C', text: '`calldata` can be modified inside the function body' },
        { id: 'D', text: 'There is no difference in modern Solidity versions' },
      ],
      correctOption: 'A',
      explanation: '`calldata` is a read-only, non-allocatable memory area where transaction data is stored, saving gas over copying to `memory`.',
      hint: 'calldata avoids expensive memory allocations for read-only args.',
      level: 'Intermediate',
    },
    {
      id: 'sol-3',
      question: 'What does the low-level `call{value: x}("")` return upon failure compared to `transfer()`?',
      options: [
        { id: 'A', text: '`transfer` forwards all gas and returns a boolean; `call` reverts' },
        { id: 'B', text: '`transfer` reverts with a 2300 gas stipend; `call` returns (bool, bytes) and forwards configurable gas' },
        { id: 'C', text: '`transfer` is for ERC-20 tokens only; `call` is for native ETH' },
        { id: 'D', text: '`transfer` can only be invoked by contract owners' },
      ],
      correctOption: 'B',
      explanation: '`transfer` caps gas at 2300 and reverts automatically; low-level `call` forwards remaining gas and requires manual boolean checking.',
      hint: 'call returns a tuple of (bool, bytes).',
      level: 'Advanced',
    },
    {
      id: 'sol-4',
      question: 'What vulnerability occurs when using `tx.origin` for authorization instead of `msg.sender`?',
      options: [
        { id: 'A', text: 'Integer overflow' },
        { id: 'B', text: 'Phishing attack via intermediate proxy contracts' },
        { id: 'C', text: 'Frontrunning' },
        { id: 'D', text: 'Reentrancy' },
      ],
      correctOption: 'B',
      explanation: '`tx.origin` represents the original EOA that signed the transaction, allowing malicious contracts to trick authorized users into executing calls.',
      hint: 'tx.origin traces back to the original EOA, not the immediate caller.',
      level: 'Advanced',
    },
    {
      id: 'sol-5',
      question: 'In upgradeable proxy contracts, why is storage layout collision a critical risk during delegatecall?',
      options: [
        { id: 'A', text: 'The proxy contract executes logic in its own storage context; mismatched variable declarations overwrite proxy variables' },
        { id: 'B', text: 'Delegatecall increases gas consumption by 100x' },
        { id: 'C', text: 'ERC-20 tokens cannot be held by proxy contracts' },
        { id: 'D', text: 'Solidity compilers reject any contract with multiple storage slots' },
      ],
      correctOption: 'A',
      explanation: '`delegatecall` executes the implementation contract logic inside the proxy storage context, so matching storage slot ordering is mandatory.',
      hint: 'Execution occurs in the context of the calling proxy storage.',
      level: 'Expert',
    },
  ],
  'react': [
    {
      id: 'react-1',
      question: 'What is the primary purpose of the `useCallback` hook in React?',
      options: [
        { id: 'A', text: 'To run asynchronous fetch side effects on component mount' },
        { id: 'B', text: 'To memoize callback function instances between re-renders and prevent unnecessary child re-renders' },
        { id: 'C', text: 'To mutate the DOM tree directly' },
        { id: 'D', text: 'To create global Redux stores' },
      ],
      correctOption: 'B',
      explanation: '`useCallback` caches a function definition between renders unless its declared dependencies change.',
      hint: 'Memoizes function reference between renders.',
      level: 'Intermediate',
    },
    {
      id: 'react-2',
      question: 'Why should keys in React lists be stable and unique instead of array indexes?',
      options: [
        { id: 'A', text: 'Array indexes cause compilation syntax errors in JSX' },
        { id: 'B', text: 'Using indexes causes component state corruption and reconciliation bugs during item reordering or deletion' },
        { id: 'C', text: 'Keys are only required in class components' },
        { id: 'D', text: 'Indexes exceed maximum memory capacity' },
      ],
      correctOption: 'B',
      explanation: 'React uses keys to identify which items have changed, been added, or removed during reconciliation.',
      hint: 'Consider what happens when items are reordered or removed.',
      level: 'Beginner',
    },
    {
      id: 'react-3',
      question: 'In React 18, what does `useTransition` enable developers to do?',
      options: [
        { id: 'A', text: 'Apply CSS transitions during page navigation' },
        { id: 'B', text: 'Mark state updates as non-urgent transitions to keep the UI responsive during intensive re-renders' },
        { id: 'C', text: 'Convert server components into client components' },
        { id: 'D', text: 'Manage WebSockets connections automatically' },
      ],
      correctOption: 'B',
      explanation: '`useTransition` lets you mark state updates as non-urgent transitions, keeping current UI interactive while new state renders.',
      hint: 'Distinguishes urgent user input from heavy background rendering.',
      level: 'Advanced',
    },
    {
      id: 'react-4',
      question: 'What is the execution timing difference between `useEffect` and `useLayoutEffect`?',
      options: [
        { id: 'A', text: '`useLayoutEffect` runs synchronously after DOM mutations before browser paint; `useEffect` runs asynchronously after paint' },
        { id: 'B', text: '`useEffect` runs before the DOM is created' },
        { id: 'C', text: '`useLayoutEffect` only works on the server' },
        { id: 'D', text: 'They execute at the exact same microtask tick' },
      ],
      correctOption: 'A',
      explanation: '`useLayoutEffect` fires synchronously after all DOM mutations, useful for reading layout measurements before the browser paints.',
      hint: 'One blocks visual browser paint to prevent flickering.',
      level: 'Advanced',
    },
    {
      id: 'react-5',
      question: 'What optimization does `React.memo` perform on a component?',
      options: [
        { id: 'A', text: 'Shallowly compares props and skips re-rendering if props are unchanged' },
        { id: 'B', text: 'Deeply clones all state objects' },
        { id: 'C', text: 'Stores component state in localStorage' },
        { id: 'D', text: 'Executes component on a Web Worker thread' },
      ],
      correctOption: 'A',
      explanation: '`React.memo` is a higher order component that skips rendering when incoming props are shallowly equal to previous props.',
      hint: 'Memoizes rendered output based on shallow prop comparison.',
      level: 'Intermediate',
    },
  ],
  'ml': [
    {
      id: 'ml-1',
      question: 'In deep learning, what is the primary purpose of an activation function in a neural network layer?',
      options: [
        { id: 'A', text: 'To normalize gradient updates across layers' },
        { id: 'B', text: 'To introduce non-linearity enabling approximation of complex non-linear functions' },
        { id: 'C', text: 'To prevent GPU memory allocation bottlenecks' },
        { id: 'D', text: 'To calculate cross-entropy loss' },
      ],
      correctOption: 'B',
      explanation: 'Without non-linear activation functions, deep neural networks collapse to a single linear transformation regardless of depth.',
      hint: 'Enables networks to learn non-linear decision boundaries.',
      level: 'Beginner',
    },
    {
      id: 'ml-2',
      question: 'What is the main difference between L1 (Lasso) and L2 (Ridge) regularization?',
      options: [
        { id: 'A', text: 'L1 produces sparse weights (feature selection) with absolute penalties; L2 penalizes squared weights' },
        { id: 'B', text: 'L1 only works for binary classification' },
        { id: 'C', text: 'L2 drives weights to exactly zero' },
        { id: 'D', text: 'L1 cannot be optimized with gradient descent' },
      ],
      correctOption: 'A',
      explanation: 'L1 regularization adds sum of absolute weights, driving irrelevant coefficients to exact zero for sparse feature selection.',
      hint: 'L1 promotes sparsity by zeroing out coefficients.',
      level: 'Intermediate',
    },
    {
      id: 'ml-3',
      question: 'In PyTorch, what does `loss.backward()` accomplish?',
      options: [
        { id: 'A', text: 'Computes gradients of the loss with respect to all graph tensors having `requires_grad=True`' },
        { id: 'B', text: 'Updates the model weights using the configured optimizer learning rate' },
        { id: 'C', text: 'Zeros all accumulated gradient buffers' },
        { id: 'D', text: 'Inverts the neural network layer order' },
      ],
      correctOption: 'A',
      explanation: '`loss.backward()` traverses the autograd computation graph backwards from the loss tensor and computes partial derivatives.',
      hint: 'Autograd graph backpropagation.',
      level: 'Intermediate',
    },
    {
      id: 'ml-4',
      question: 'When evaluating a classification model with severe class imbalance, which metric is most informative?',
      options: [
        { id: 'A', text: 'Standard Accuracy' },
        { id: 'B', text: 'Precision-Recall AUC (PR-AUC) and F1-Score' },
        { id: 'C', text: 'Mean Squared Error (MSE)' },
        { id: 'D', text: 'R-Squared' },
      ],
      correctOption: 'B',
      explanation: 'In highly imbalanced datasets (e.g. 99% negative), standard accuracy is misleading. PR-AUC and F1 focus on positive class precision and recall.',
      hint: 'Focus on precision and recall rather than overall accuracy.',
      level: 'Intermediate',
    },
    {
      id: 'ml-5',
      question: 'In Transformer architectures, why is the Scaled Dot-Product Attention scaled by `1 / sqrt(d_k)`?',
      options: [
        { id: 'A', text: 'To prevent large dot product values from pushing the softmax function into regions with vanishingly small gradients' },
        { id: 'B', text: 'To convert values into probabilities without softmax' },
        { id: 'C', text: 'To reduce the matrix dimension size' },
        { id: 'D', text: 'To enable recurrent backpropagation' },
      ],
      correctOption: 'A',
      explanation: 'For large values of d_k, dot products grow large in magnitude, pushing softmax into regions with extremely small gradients. Scaling by 1/sqrt(d_k) counteracts this.',
      hint: 'Prevents vanishing softmax gradients on large vector dimensions.',
      level: 'Advanced',
    },
  ],
  'dsa': [
    {
      id: 'dsa-1',
      question: 'What is the average and worst-case time complexity of QuickSort?',
      options: [
        { id: 'A', text: 'O(n log n) average, O(n^2) worst-case' },
        { id: 'B', text: 'O(n) average, O(n log n) worst-case' },
        { id: 'C', text: 'O(n^2) average, O(n^3) worst-case' },
        { id: 'D', text: 'O(log n) average, O(n) worst-case' },
      ],
      correctOption: 'A',
      explanation: 'QuickSort runs in O(n log n) average time but degrades to O(n^2) if poor pivot selections occur (e.g. already sorted array with first element as pivot).',
      hint: 'Average case is n log n; worst case occurs on pathological pivots.',
      level: 'Beginner',
    },
    {
      id: 'dsa-2',
      question: 'Which composite data structure is optimal for implementing an LRU (Least Recently Used) Cache with O(1) get and put operations?',
      options: [
        { id: 'A', text: 'Doubly Linked List combined with a Hash Map' },
        { id: 'B', text: 'Binary Search Tree combined with an Array' },
        { id: 'C', text: 'Min-Heap and Stack' },
        { id: 'D', text: 'Trie and Queue' },
      ],
      correctOption: 'A',
      explanation: 'The Hash Map provides O(1) key lookup, while the Doubly Linked List provides O(1) node removal and insertion at the head/tail.',
      hint: 'Hash Map for O(1) lookup + Doubly Linked List for O(1) ordering.',
      level: 'Intermediate',
    },
    {
      id: 'dsa-3',
      question: 'In dynamic programming, what two properties characterize a problem solvable by DP?',
      options: [
        { id: 'A', text: 'Optimal substructure and overlapping subproblems' },
        { id: 'B', text: 'Greedy choice property and random walks' },
        { id: 'C', text: 'Sorting invariance and hash collisions' },
        { id: 'D', text: 'Linear independence and recursion depth' },
      ],
      correctOption: 'A',
      explanation: 'Dynamic programming requires optimal substructure (optimal solution contains optimal sub-solutions) and overlapping subproblems (memoization reduces redundant computations).',
      hint: 'Optimal substructure & overlapping subproblems.',
      level: 'Intermediate',
    },
    {
      id: 'dsa-4',
      question: 'What is the time complexity of Dijkstra’s Algorithm using a Min-Heap (priority queue) for a graph with V vertices and E edges?',
      options: [
        { id: 'A', text: 'O((V + E) log V)' },
        { id: 'B', text: 'O(V^3)' },
        { id: 'C', text: 'O(E^2)' },
        { id: 'D', text: 'O(V log E)' },
      ],
      correctOption: 'A',
      explanation: 'Extract-min takes O(log V) per vertex (V log V) and decrease-key takes O(log V) per edge (E log V), giving O((V + E) log V).',
      hint: 'V vertex extractions plus E edge relaxations in a binary heap.',
      level: 'Advanced',
    },
    {
      id: 'dsa-5',
      question: 'What is the amortized insertion time complexity for a dynamic array (like Python list / C++ std::vector)?',
      options: [
        { id: 'A', text: 'O(1)' },
        { id: 'B', text: 'O(n)' },
        { id: 'C', text: 'O(log n)' },
        { id: 'D', text: 'O(n log n)' },
      ],
      correctOption: 'A',
      explanation: 'Although resizing takes O(n), it happens geometrically infrequently, averaging O(1) amortized work per insertion.',
      hint: 'Geometric capacity doubling yields constant average time.',
      level: 'Beginner',
    },
  ],
  'ui-ux': [
    {
      id: 'ui-1',
      question: 'What is the primary objective of WCAG 2.1 contrast ratio guidelines (e.g. 4.5:1 for normal text)?',
      options: [
        { id: 'A', text: 'To make websites look visually minimalistic' },
        { id: 'B', text: 'To ensure readability and accessible perception for users with visual impairments' },
        { id: 'C', text: 'To speed up browser rendering engine rasterization' },
        { id: 'D', text: 'To comply with search engine keyword density rules' },
      ],
      correctOption: 'B',
      explanation: 'WCAG contrast ratios guarantee that foreground text is clearly distinguishable against background colors for accessibility.',
      hint: 'Ensures readable contrast for accessibility.',
      level: 'Beginner',
    },
    {
      id: 'ui-2',
      question: 'In Fitts’s Law, what two factors determine the time required to rapidly move to a target area?',
      options: [
        { id: 'A', text: 'Distance to target and width/size of the target' },
        { id: 'B', text: 'Color saturation and font size' },
        { id: 'C', text: 'Screen resolution and DPI density' },
        { id: 'D', text: 'User age and mouse sensitivity' },
      ],
      correctOption: 'A',
      explanation: 'Fitts’s Law states MT = a + b * log2(2D / W), relating movement time directly to target distance and width.',
      hint: 'Distance and target width.',
      level: 'Intermediate',
    },
    {
      id: 'ui-3',
      question: 'What is the Atomic Design methodology hierarchy from smallest to largest component?',
      options: [
        { id: 'A', text: 'Atoms -> Molecules -> Organisms -> Templates -> Pages' },
        { id: 'B', text: 'Pages -> Templates -> Organisms -> Molecules -> Atoms' },
        { id: 'C', text: 'Tokens -> Styles -> Components -> Views' },
        { id: 'D', text: 'Elements -> Groups -> Layouts -> Screens' },
      ],
      correctOption: 'A',
      explanation: 'Brad Frost’s Atomic Design starts with Atoms (buttons, inputs), building into Molecules, Organisms, Templates, and Pages.',
      hint: 'Atoms build into Molecules and Organisms.',
      level: 'Beginner',
    },
    {
      id: 'ui-4',
      question: 'In Figma, what does Auto Layout enable UI designers to build?',
      options: [
        { id: 'A', text: 'Responsive frames that grow, shrink, and wrap dynamically with padding and gap controls' },
        { id: 'B', text: '3D raytraced rendering models' },
        { id: 'C', text: 'Rasterized bitmap icons' },
        { id: 'D', text: 'SQL database schemas' },
      ],
      correctOption: 'A',
      explanation: 'Auto Layout creates dynamic frames modeled after CSS Flexbox that automatically resize based on nested text and elements.',
      hint: 'Dynamic responsive frames akin to CSS Flexbox.',
      level: 'Intermediate',
    },
    {
      id: 'ui-5',
      question: 'What is the "Aesthetic-Usability Effect" discovered in human-computer interaction research?',
      options: [
        { id: 'A', text: 'Users perceive aesthetically pleasing designs as more usable and are more forgiving of minor usability issues' },
        { id: 'B', text: 'Aesthetic designs cause higher user confusion' },
        { id: 'C', text: 'Visual appeal has zero correlation with user retention' },
        { id: 'D', text: 'Minimalist designs with no colors always score lowest' },
      ],
      correctOption: 'A',
      explanation: 'Users form positive emotional responses to visually refined interfaces, making them perceive them as easier to operate.',
      hint: 'Visual appeal fosters positive usability perception.',
      level: 'Intermediate',
    },
  ],
  'calculus': [
    {
      id: 'math-1',
      question: 'What is the derivative of f(x) = e^(3x) with respect to x?',
      options: [
        { id: 'A', text: '3e^(3x)' },
        { id: 'B', text: 'e^(3x)' },
        { id: 'C', text: '(1/3)e^(3x)' },
        { id: 'D', text: '3x * e^(3x-1)' },
      ],
      correctOption: 'A',
      explanation: 'Using the chain rule: d/dx[e^(g(x))] = g\'(x) * e^(g(x)) = 3 * e^(3x).',
      hint: 'Apply the chain rule with g(x) = 3x.',
      level: 'Beginner',
    },
    {
      id: 'math-2',
      question: 'What does the dot product of two non-zero vectors equal to 0 indicate?',
      options: [
        { id: 'A', text: 'The vectors are orthogonal (perpendicular)' },
        { id: 'B', text: 'The vectors are parallel' },
        { id: 'C', text: 'The vectors have equal magnitude' },
        { id: 'D', text: 'The vectors are collinear' },
      ],
      correctOption: 'A',
      explanation: 'u · v = ||u|| ||v|| cos(θ). When dot product is 0 and magnitudes are non-zero, cos(θ) = 0, meaning θ = 90° (orthogonal).',
      hint: 'cos(90°) = 0.',
      level: 'Beginner',
    },
    {
      id: 'math-3',
      question: 'In multivariable calculus, what does the gradient vector ∇f(x, y) represent geometrically?',
      options: [
        { id: 'A', text: 'The direction of steepest ascent on the scalar field surface' },
        { id: 'B', text: 'The area under the contour curves' },
        { id: 'C', text: 'The tangent plane normal to the z-axis' },
        { id: 'D', text: 'The second-order inflection curvature' },
      ],
      correctOption: 'A',
      explanation: 'The gradient vector points in the direction of greatest rate of increase of the function, and its magnitude is the slope in that direction.',
      hint: 'Points in direction of maximum rate of increase.',
      level: 'Intermediate',
    },
    {
      id: 'math-4',
      question: 'What is the determinant of a 2x2 matrix [[a, b], [c, d]]?',
      options: [
        { id: 'A', text: 'ad - bc' },
        { id: 'B', text: 'ab - cd' },
        { id: 'C', text: 'ac + bd' },
        { id: 'D', text: 'a + d - b - c' },
      ],
      correctOption: 'A',
      explanation: 'The determinant of a 2x2 matrix is computed by multiplying the main diagonal elements and subtracting the product of the off-diagonal elements (ad - bc).',
      hint: 'Main diagonal minus anti-diagonal product.',
      level: 'Beginner',
    },
    {
      id: 'math-5',
      question: 'What is the indefinite integral ∫ (1 / x) dx for x > 0?',
      options: [
        { id: 'A', text: 'ln(x) + C' },
        { id: 'B', text: '-1 / x^2 + C' },
        { id: 'C', text: 'e^x + C' },
        { id: 'D', text: '1 / (2x^2) + C' },
      ],
      correctOption: 'A',
      explanation: 'The antiderivative of 1/x for positive x is ln(x) + C.',
      hint: 'The natural logarithm derivative is 1/x.',
      level: 'Beginner',
    },
  ],
  'general': [
    {
      id: 'gen-1',
      question: 'How do you structure an effective hands-on peer learning session for a novice student?',
      options: [
        { id: 'A', text: 'Lecture non-stop for 60 minutes without asking questions' },
        { id: 'B', text: 'Assess prior knowledge, introduce concepts with real examples, practice together, and solicit active recall feedback' },
        { id: 'C', text: 'Assign reading material and end the call immediately' },
        { id: 'D', text: 'Only show code solutions without explaining reasoning' },
      ],
      correctOption: 'B',
      explanation: 'Effective mentorship involves assessing learner needs, providing interactive examples, and guiding active recall.',
      hint: 'Active recall and interactive practice.',
      level: 'Beginner',
    },
    {
      id: 'gen-2',
      question: 'When debugging or diagnosing a complex error with a learner, what is the best pedagogical practice?',
      options: [
        { id: 'A', text: 'Take over their screen and fix the code silently' },
        { id: 'B', text: 'Guide the student to read error stack traces, explain assumptions, and formulate test hypotheses' },
        { id: 'C', text: 'Tell the student to switch to a different subject' },
        { id: 'D', text: 'Ignore the error and skip to the end' },
      ],
      correctOption: 'B',
      explanation: 'Teaching students how to systematically interpret errors and test hypotheses builds long-term problem solving autonomy.',
      hint: 'Build problem-solving autonomy through hypothesis testing.',
      level: 'Intermediate',
    },
    {
      id: 'gen-3',
      question: 'In educational psychology, what is "Scaffolding" during skill acquisition?',
      options: [
        { id: 'A', text: 'Providing temporary structured support that is gradually removed as the learner gains autonomy' },
        { id: 'B', text: 'Giving students exams every 10 minutes' },
        { id: 'C', text: 'Refusing to answer student questions' },
        { id: 'D', text: 'Automating all grading with scripts' },
      ],
      correctOption: 'A',
      explanation: 'Scaffolding breaks learning into chunks and offers tools/structure, fading support as competence develops.',
      hint: 'Temporary structured support faded over time.',
      level: 'Intermediate',
    },
    {
      id: 'gen-4',
      question: 'What is the primary difference between Formative and Summative assessment in peer tutoring?',
      options: [
        { id: 'A', text: 'Formative is ongoing feedback to guide learning in real time; Summative evaluates cumulative achievement at the conclusion' },
        { id: 'B', text: 'Formative only uses multiple choice; Summative uses essays' },
        { id: 'C', text: 'Summative happens before learning begins' },
        { id: 'D', text: 'They are completely synonymous' },
      ],
      correctOption: 'A',
      explanation: 'Formative assessment monitors student learning to provide ongoing feedback, whereas summative assessment evaluates student learning at the end of an instructional unit.',
      hint: 'Ongoing guidance vs final evaluation.',
      level: 'Intermediate',
    },
    {
      id: 'gen-5',
      question: 'How should a mentor address "Cognitive Overload" when a learner is struggling with complex concepts?',
      options: [
        { id: 'A', text: 'Chunk information into smaller digestible units, eliminate extraneous details, and use worked examples' },
        { id: 'B', text: 'Increase the speaking speed and double the reading assignment' },
        { id: 'C', text: 'Introduce three new frameworks simultaneously' },
        { id: 'D', text: 'End the session immediately without guidance' },
      ],
      correctOption: 'A',
      explanation: 'Managing cognitive load requires chunking complex knowledge, utilizing dual coding, and providing clear step-by-step worked examples.',
      hint: 'Chunk information and use worked examples.',
      level: 'Intermediate',
    },
  ],
};

// ============================================================
// GEMINI SERVER-SIDE API CALLS & PROMPT INJECTION ISOLATION
// ============================================================

export async function generateSkillAssessment(params: {
  skillName: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  questionCount?: number;
}): Promise<GeneratedQuiz> {
  const skillName = (params.skillName || 'Python').trim();
  const level = params.proficiency || 'Intermediate';
  const count = Math.max(5, params.questionCount || 5);

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const model = process.env.GEMINI_MODEL || process.env.AI_MODEL_NAME || 'gemini-1.5-flash';

  const normalized = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');

  const getLocalQuestions = (): AssessmentQuestion[] => {
    if (normalized.includes('python')) {
      return LOCAL_PYTHON_QUIZ_BANK[level] || LOCAL_PYTHON_QUIZ_BANK['Intermediate'];
    }
    for (const [key, questions] of Object.entries(LOCAL_SKILL_QUIZ_BANKS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return questions;
      }
    }
    if (normalized.includes('figma') || normalized.includes('design')) {
      return LOCAL_SKILL_QUIZ_BANKS['ui-ux'];
    }
    if (normalized.includes('pytorch') || normalized.includes('ml') || normalized.includes('ai') || normalized.includes('learning')) {
      return LOCAL_SKILL_QUIZ_BANKS['ml'];
    }
    if (normalized.includes('math') || normalized.includes('calculus') || normalized.includes('algebra')) {
      return LOCAL_SKILL_QUIZ_BANKS['calculus'];
    }
    if (normalized.includes('data') || normalized.includes('algorithm') || normalized.includes('dsa') || normalized.includes('tree')) {
      return LOCAL_SKILL_QUIZ_BANKS['dsa'];
    }
    if (normalized.includes('solidity') || normalized.includes('contract') || normalized.includes('web3') || normalized.includes('blockchain')) {
      return LOCAL_SKILL_QUIZ_BANKS['solidity'];
    }
    if (normalized.includes('react') || normalized.includes('next') || normalized.includes('frontend') || normalized.includes('javascript') || normalized.includes('typescript')) {
      return LOCAL_SKILL_QUIZ_BANKS['react'];
    }
    return LOCAL_SKILL_QUIZ_BANKS['general'];
  };

  // If no Gemini API key configured, use local curated question bank for this specific skill
  if (!apiKey || apiKey.trim() === '') {
    console.log(`[AI Provider: LOCAL_FALLBACK] Gemini API key not provided. Serving curated ${level} assessment bank for ${skillName}.`);
    const bank = getLocalQuestions();
    return {
      assessmentVersion: 'v1.0-curated',
      skill: skillName,
      difficulty: level,
      provider: 'LOCAL_FALLBACK',
      questions: bank.slice(0, Math.max(5, count)),
    };
  }

  try {
    const systemInstruction = `You are a principal university computer science & domain assessment examiner.
Generate an objective, strictly accurate multiple-choice skill assessment for the skill: "${skillName}".
Rules:
1. Target Difficulty Level: ${level}.
2. Exactly ${count} questions (minimum 5 questions) testing real concepts in ${skillName}.
3. Every question must have exactly 4 choices (labeled A, B, C, D) and exactly ONE correct answer.
4. Provide a clear, technical explanation and a hint.
5. Strict structured JSON output following the schema provided. No conversational preamble or code blocks.`;

    const userPrompt = `Generate a ${count}-question assessment (minimum 5 questions) for "${skillName}" at the "${level}" proficiency tier. Output pure JSON adhering to the specified schema.`;

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
      console.warn(`[Gemini API Error] Status: ${response.status}. Falling back to curated bank for ${skillName}.`);
      const bank = getLocalQuestions();
      return {
        assessmentVersion: 'v1.0-fallback',
        skill: skillName,
        difficulty: level,
        provider: 'LOCAL_FALLBACK',
        questions: bank.slice(0, Math.max(5, count)),
      };
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty Gemini response');

    const parsedJson = JSON.parse(rawText);
    const validated = GeneratedQuizSchema.safeParse(parsedJson);

    if (validated.success && validated.data.questions.length >= 5) {
      return {
        ...validated.data,
        skill: skillName,
        provider: 'GEMINI_AI',
      };
    } else {
      console.warn(`[Gemini Schema Mismatch or <5 questions for ${skillName}] Falling back to curated bank:`, validated.error);
      const bank = getLocalQuestions();
      return {
        assessmentVersion: 'v1.0-fallback',
        skill: skillName,
        difficulty: level,
        provider: 'LOCAL_FALLBACK',
        questions: bank.slice(0, Math.max(5, count)),
      };
    }
  } catch (err) {
    console.error(`[Gemini Request Exception for ${skillName}] Fallback activated:`, err);
    const bank = getLocalQuestions();
    return {
      assessmentVersion: 'v1.0-fallback',
      skill: skillName,
      difficulty: level,
      provider: 'LOCAL_FALLBACK',
      questions: bank.slice(0, Math.max(5, count)),
    };
  }
}

export async function generatePythonQuiz(params: {
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  questionCount?: number;
}): Promise<GeneratedQuiz> {
  return generateSkillAssessment({
    skillName: 'Python',
    proficiency: params.proficiency,
    questionCount: params.questionCount,
  });
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
