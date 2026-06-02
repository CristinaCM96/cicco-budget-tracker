import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Download,
  Edit3,
  Moon,
  PiggyBank,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import "./App.css";

const STORAGE_KEYS = {
  transactions: "cicco-budget-transactions-v3",
  goals: "cicco-budget-goals-v2",
  budgets: "cicco-budget-category-budgets-v1",
  recurring: "cicco-budget-recurring-v1",
  theme: "cicco-budget-theme-v1",
  currency: "cicco-budget-currency-v1",
};

const transactionCategories = [
  "Housing",
  "Groceries",
  "Transport",
  "Bills",
  "Subscriptions",
  "Coffee",
  "Health",
  "Fun Money",
  "Savings",
  "Travel",
  "Other",
];

const currencyOptions = [
  {
    code: "EUR",
    label: "Euro",
    symbol: "€",
    locale: "de-AT",
  },
  {
    code: "USD",
    label: "US Dollar",
    symbol: "$",
    locale: "en-US",
  },
  {
    code: "GBP",
    label: "British Pound",
    symbol: "£",
    locale: "en-GB",
  },
];

const initialTransactionForm = {
  title: "",
  type: "expense",
  category: "Groceries",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

const initialGoalForm = {
  title: "",
  targetAmount: "",
  currentAmount: "",
  deadline: "",
};

const initialBudgetForm = {
  category: "Groceries",
  limit: "",
};

const initialRecurringForm = {
  title: "",
  amount: "",
  category: "Subscriptions",
  dueDay: "1",
  note: "",
  isActive: true,
};

const initialErrors = {
  transaction: {},
  goal: {},
  budget: {},
  recurring: {},
};

const sampleTransactions = [
  {
    id: "sample-transaction-1",
    title: "Monthly paycheck",
    type: "income",
    category: "Other",
    amount: 1800,
    date: new Date().toISOString().slice(0, 10),
    note: "Main income",
  },
  {
    id: "sample-transaction-2",
    title: "Groceries",
    type: "expense",
    category: "Groceries",
    amount: 76.42,
    date: new Date().toISOString().slice(0, 10),
    note: "Weekly food shop",
  },
  {
    id: "sample-transaction-3",
    title: "Coffee",
    type: "expense",
    category: "Coffee",
    amount: 4.9,
    date: new Date().toISOString().slice(0, 10),
    note: "Emotionally necessary",
  },
  {
    id: "sample-transaction-4",
    title: "Savings transfer",
    type: "expense",
    category: "Savings",
    amount: 150,
    date: new Date().toISOString().slice(0, 10),
    note: "Future plan fund",
  },
];

const sampleGoals = [
  {
    id: "sample-goal-1",
    title: "Emergency Fund",
    targetAmount: 1000,
    currentAmount: 250,
    deadline: "2026-12-31",
  },
  {
    id: "sample-goal-2",
    title: "Travel Fund",
    targetAmount: 800,
    currentAmount: 320,
    deadline: "2026-08-01",
  },
];

const sampleBudgets = [
  { id: "sample-budget-1", category: "Groceries", limit: 250 },
  { id: "sample-budget-2", category: "Coffee", limit: 50 },
  { id: "sample-budget-3", category: "Subscriptions", limit: 60 },
];

const sampleRecurringPayments = [
  {
    id: "sample-recurring-1",
    title: "Phone bill",
    amount: 25,
    category: "Bills",
    dueDay: 5,
    note: "Monthly phone plan",
    isActive: true,
  },
  {
    id: "sample-recurring-2",
    title: "Streaming subscription",
    amount: 12.99,
    category: "Subscriptions",
    dueDay: 15,
    note: "Monthly subscription",
    isActive: true,
  },
];

function App() {
  const importInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const [transactions, setTransactions] = useState(() =>
    loadFromStorage(STORAGE_KEYS.transactions, [])
  );

  const [goals, setGoals] = useState(() =>
    loadFromStorage(STORAGE_KEYS.goals, [])
  );

  const [budgets, setBudgets] = useState(() =>
    loadFromStorage(STORAGE_KEYS.budgets, [])
  );

  const [recurringPayments, setRecurringPayments] = useState(() =>
    loadFromStorage(STORAGE_KEYS.recurring, [])
  );

  const [theme, setTheme] = useState(() =>
    loadFromStorage(STORAGE_KEYS.theme, "light")
  );

  const [currency, setCurrency] = useState(() =>
    loadFromStorage(STORAGE_KEYS.currency, "EUR")
  );

  const [transactionForm, setTransactionForm] = useState(initialTransactionForm);
  const [goalForm, setGoalForm] = useState(initialGoalForm);
  const [budgetForm, setBudgetForm] = useState(initialBudgetForm);
  const [recurringForm, setRecurringForm] = useState(initialRecurringForm);

  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editingRecurringId, setEditingRecurringId] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [searchTerm, setSearchTerm] = useState("");

  const [errors, setErrors] = useState(initialErrors);
  const [toast, setToast] = useState(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const formatMoney = (value) => formatCurrency(value, currency);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.recurring,
      JSON.stringify(recurringPayments)
    );
  }, [recurringPayments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currency, JSON.stringify(currency));
  }, [currency]);

  const availableMonths = useMemo(() => {
    const monthKeys = transactions.map((transaction) =>
      getMonthKey(transaction.date)
    );

    return [...new Set([getCurrentMonthKey(), ...monthKeys])].sort().reverse();
  }, [transactions]);

  const allMonthlyTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) => getMonthKey(transaction.date) === selectedMonth
    );
  }, [transactions, selectedMonth]);

  const monthlyTransactions = useMemo(() => {
    return allMonthlyTransactions
      .filter((transaction) => {
        const searchableText = `${transaction.title} ${transaction.category} ${transaction.note}`;
        return searchableText.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allMonthlyTransactions, searchTerm]);

  const monthlyTotals = useMemo(() => {
    const income = allMonthlyTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const expenses = allMonthlyTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const balance = income - expenses;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

    return { income, expenses, balance, savingsRate };
  }, [allMonthlyTransactions]);

  const categoryBreakdown = useMemo(() => {
    const totalsByCategory = allMonthlyTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((totals, transaction) => {
        totals[transaction.category] =
          (totals[transaction.category] || 0) + Number(transaction.amount);
        return totals;
      }, {});

    return Object.entries(totalsByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [allMonthlyTransactions]);

  const budgetProgress = useMemo(() => {
    return budgets
      .map((budget) => {
        const spent =
          categoryBreakdown.find((item) => item.category === budget.category)
            ?.amount || 0;

        const percentage =
          Number(budget.limit) > 0
            ? Math.round((spent / Number(budget.limit)) * 100)
            : 0;

        return {
          ...budget,
          spent,
          percentage,
          remaining: Number(budget.limit) - spent,
          isOverBudget: spent > Number(budget.limit),
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgets, categoryBreakdown]);

  const highestCategoryAmount = categoryBreakdown[0]?.amount || 1;

  const totalGoalTarget = goals.reduce(
    (sum, goal) => sum + Number(goal.targetAmount),
    0
  );

  const totalGoalSaved = goals.reduce(
    (sum, goal) => sum + Number(goal.currentAmount),
    0
  );

  const totalGoalProgress =
    totalGoalTarget > 0 ? Math.round((totalGoalSaved / totalGoalTarget) * 100) : 0;

  const activeRecurringTotal = recurringPayments
    .filter((payment) => payment.isActive)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const monthlyInsights = useMemo(() => {
    const biggestCategory = categoryBreakdown[0];
    const overBudgetCategories = budgetProgress.filter(
      (budget) => budget.isOverBudget
    );

    const insights = [];

    if (monthlyTotals.income === 0 && monthlyTotals.expenses === 0) {
      insights.push(
        "No monthly data yet. Add transactions or load sample data to preview the dashboard."
      );
      return insights;
    }

    if (biggestCategory) {
      insights.push(
        `Your biggest spending category this month is ${
          biggestCategory.category
        } at ${formatCurrency(biggestCategory.amount, currency)}.`
      );
    }

    if (monthlyTotals.balance >= 0) {
      insights.push(
        `You are currently positive by ${formatCurrency(
          monthlyTotals.balance,
          currency
        )} for ${formatMonthLabel(selectedMonth)}.`
      );
    } else {
      insights.push(
        `Your expenses are currently ${formatCurrency(
          Math.abs(monthlyTotals.balance),
          currency
        )} above your income this month.`
      );
    }

    if (monthlyTotals.income > 0) {
      insights.push(`Your current savings rate is ${monthlyTotals.savingsRate}%.`);
    }

    if (overBudgetCategories.length > 0) {
      insights.push(
        `${overBudgetCategories.length} budget ${
          overBudgetCategories.length === 1 ? "category is" : "categories are"
        } over limit.`
      );
    } else if (budgetProgress.length > 0) {
      insights.push("All tracked category budgets are currently within limit.");
    }

    if (activeRecurringTotal > 0) {
      insights.push(
        `Your active recurring payments total ${formatCurrency(
          activeRecurringTotal,
          currency
        )} per month.`
      );
    }

    return insights;
  }, [
    categoryBreakdown,
    budgetProgress,
    monthlyTotals,
    activeRecurringTotal,
    selectedMonth,
    currency,
  ]);

  function showToast(message, type = "success") {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ message, type });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  }

  function updateErrors(section, sectionErrors) {
    setErrors((currentErrors) => ({
      ...currentErrors,
      [section]: sectionErrors,
    }));
  }

  function clearErrors(section) {
    updateErrors(section, {});
  }

  function handleTransactionSubmit(event) {
    event.preventDefault();

    const formErrors = validateTransactionForm(transactionForm);

    if (Object.keys(formErrors).length > 0) {
      updateErrors("transaction", formErrors);
      showToast("Please fix the highlighted transaction fields.", "error");
      return;
    }

    const transactionData = {
      title: transactionForm.title.trim(),
      type: transactionForm.type,
      category: transactionForm.category,
      amount: Number(transactionForm.amount),
      date: transactionForm.date,
      note: transactionForm.note.trim(),
    };

    if (editingTransactionId) {
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === editingTransactionId
            ? { ...transaction, ...transactionData }
            : transaction
        )
      );
      setEditingTransactionId(null);
      showToast("Transaction updated.");
    } else {
      setTransactions((current) => [
        { id: crypto.randomUUID(), ...transactionData },
        ...current,
      ]);
      showToast("Transaction added.");
    }

    setSelectedMonth(getMonthKey(transactionForm.date));
    setTransactionForm(initialTransactionForm);
    clearErrors("transaction");
  }

  function handleGoalSubmit(event) {
    event.preventDefault();

    const formErrors = validateGoalForm(goalForm);

    if (Object.keys(formErrors).length > 0) {
      updateErrors("goal", formErrors);
      showToast("Please fix the highlighted savings goal fields.", "error");
      return;
    }

    const goalData = {
      title: goalForm.title.trim(),
      targetAmount: Number(goalForm.targetAmount),
      currentAmount: Number(goalForm.currentAmount),
      deadline: goalForm.deadline,
    };

    if (editingGoalId) {
      setGoals((current) =>
        current.map((goal) =>
          goal.id === editingGoalId ? { ...goal, ...goalData } : goal
        )
      );
      setEditingGoalId(null);
      showToast("Savings goal updated.");
    } else {
      setGoals((current) => [{ id: crypto.randomUUID(), ...goalData }, ...current]);
      showToast("Savings goal added.");
    }

    setGoalForm(initialGoalForm);
    clearErrors("goal");
  }

  function handleBudgetSubmit(event) {
    event.preventDefault();

    const formErrors = validateBudgetForm(budgetForm);

    if (Object.keys(formErrors).length > 0) {
      updateErrors("budget", formErrors);
      showToast("Please fix the highlighted budget fields.", "error");
      return;
    }

    const limit = Number(budgetForm.limit);
    const budgetData = {
      category: budgetForm.category,
      limit,
    };

    if (editingBudgetId) {
      setBudgets((current) =>
        current.map((budget) =>
          budget.id === editingBudgetId ? { ...budget, ...budgetData } : budget
        )
      );
      setEditingBudgetId(null);
      showToast("Category budget updated.");
    } else {
      const existingBudget = budgets.find(
        (budget) => budget.category === budgetForm.category
      );

      if (existingBudget) {
        setBudgets((current) =>
          current.map((budget) =>
            budget.category === budgetForm.category
              ? { ...budget, limit }
              : budget
          )
        );
        showToast("Existing category budget updated.");
      } else {
        setBudgets((current) => [
          { id: crypto.randomUUID(), ...budgetData },
          ...current,
        ]);
        showToast("Category budget added.");
      }
    }

    setBudgetForm(initialBudgetForm);
    clearErrors("budget");
  }

  function handleRecurringSubmit(event) {
    event.preventDefault();

    const formErrors = validateRecurringForm(recurringForm);

    if (Object.keys(formErrors).length > 0) {
      updateErrors("recurring", formErrors);
      showToast("Please fix the highlighted recurring payment fields.", "error");
      return;
    }

    const recurringData = {
      title: recurringForm.title.trim(),
      amount: Number(recurringForm.amount),
      category: recurringForm.category,
      dueDay: Number(recurringForm.dueDay),
      note: recurringForm.note.trim(),
      isActive: recurringForm.isActive,
    };

    if (editingRecurringId) {
      setRecurringPayments((current) =>
        current.map((payment) =>
          payment.id === editingRecurringId
            ? { ...payment, ...recurringData }
            : payment
        )
      );
      setEditingRecurringId(null);
      showToast("Recurring payment updated.");
    } else {
      setRecurringPayments((current) => [
        { id: crypto.randomUUID(), ...recurringData },
        ...current,
      ]);
      showToast("Recurring payment added.");
    }

    setRecurringForm(initialRecurringForm);
    clearErrors("recurring");
  }

  function addRecurringToSelectedMonth(payment) {
    const date = getDateForDueDay(selectedMonth, payment.dueDay);

    setTransactions((current) => [
      {
        id: crypto.randomUUID(),
        title: payment.title,
        type: "expense",
        category: payment.category,
        amount: Number(payment.amount),
        date,
        note: payment.note || "Recurring payment",
      },
      ...current,
    ]);

    setSelectedMonth(getMonthKey(date));
    showToast(`${payment.title} added to ${formatMonthLabel(selectedMonth)}.`);
  }

  function handleExportData() {
    const exportData = {
      app: "Cicco Budget Tracker",
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
      goals,
      budgets,
      recurringPayments,
      theme,
      currency,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `cicco-budget-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showToast("JSON backup exported.");
  }

  function handleImportData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const importedData = JSON.parse(reader.result);

        if (!isValidImportData(importedData)) {
          throw new Error("Invalid backup shape");
        }

        setTransactions(importedData.transactions || []);
        setGoals(importedData.goals || []);
        setBudgets(importedData.budgets || []);
        setRecurringPayments(importedData.recurringPayments || []);
        setTheme(importedData.theme || "light");
        setCurrency(importedData.currency || "EUR");
        setSearchTerm("");
        resetEditingState();
        showToast("Backup imported successfully.");
      } catch {
        showToast("That file could not be imported.", "error");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  function handleLoadSampleData() {
    setTransactions(sampleTransactions);
    setGoals(sampleGoals);
    setBudgets(sampleBudgets);
    setRecurringPayments(sampleRecurringPayments);
    setSelectedMonth(getCurrentMonthKey());
    setSearchTerm("");
    resetEditingState();
    setErrors(initialErrors);
    showToast("Sample data loaded.");
  }

  function handleRequestClearAllData() {
    setIsClearModalOpen(true);
  }

  function handleConfirmClearAllData() {
    setTransactions([]);
    setGoals([]);
    setBudgets([]);
    setRecurringPayments([]);
    setSearchTerm("");
    resetEditingState();
    setErrors(initialErrors);
    setIsClearModalOpen(false);
    showToast("All data cleared.");
  }

  function resetEditingState() {
    setEditingTransactionId(null);
    setEditingGoalId(null);
    setEditingBudgetId(null);
    setEditingRecurringId(null);
    setTransactionForm(initialTransactionForm);
    setGoalForm(initialGoalForm);
    setBudgetForm(initialBudgetForm);
    setRecurringForm(initialRecurringForm);
  }

  return (
    <main className={`app ${theme === "dark" ? "dark" : ""}`}>
      <section className="app-shell">
        <header className="hero">
          <div className="hero-content">
            <p className="eyebrow">Project Cicco</p>
            <h1>Cicco Budget Tracker</h1>
            <p>
              A cozy personal finance dashboard for tracking income, expenses,
              category budgets, recurring payments, and savings goals without
              needing an emotional support spreadsheet.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleLoadSampleData}
              >
                <Sparkles size={17} />
                Load sample data
              </button>

              <button type="button" className="ghost-button" onClick={handleExportData}>
                <Download size={17} />
                Export JSON
              </button>

              <button
                type="button"
                className="ghost-button"
                onClick={() => importInputRef.current.click()}
              >
                <Upload size={17} />
                Import JSON
              </button>

              <input
                ref={importInputRef}
                className="hidden-file-input"
                type="file"
                accept="application/json"
                onChange={handleImportData}
              />

              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setTheme((currentTheme) => {
                    const nextTheme = currentTheme === "dark" ? "light" : "dark";
                    showToast(
                      nextTheme === "dark"
                        ? "Dark mode enabled."
                        : "Light mode enabled."
                    );
                    return nextTheme;
                  });
                }}
              >
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>

              <label className="currency-control">
                <span>Currency</span>
                <select
                  value={currency}
                  onChange={(event) => {
                    setCurrency(event.target.value);
                    showToast(`Currency changed to ${event.target.value}.`);
                  }}
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.symbol} {option.code}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="ghost-button danger-text"
                onClick={handleRequestClearAllData}
              >
                <RotateCcw size={17} />
                Clear all data
              </button>
            </div>
          </div>

          <div className="month-card">
            <CalendarDays size={24} />
            <label htmlFor="month">Viewing month</label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="stats-grid">
          <StatCard
            title="Income"
            value={formatMoney(monthlyTotals.income)}
            description="Money entering the kingdom"
            icon={<TrendingUp size={24} />}
          />

          <StatCard
            title="Expenses"
            value={formatMoney(monthlyTotals.expenses)}
            description="Budget goblins detected"
            icon={<TrendingDown size={24} />}
          />

          <StatCard
            title="Balance"
            value={formatMoney(monthlyTotals.balance)}
            description={
              monthlyTotals.balance >= 0
                ? "Still standing. Iconic."
                : "The goblins are winning."
            }
            icon={<Wallet size={24} />}
            isNegative={monthlyTotals.balance < 0}
          />

          <StatCard
            title="Goal Progress"
            value={`${totalGoalProgress}%`}
            description={`${formatMoney(totalGoalSaved)} saved of ${formatMoney(
              totalGoalTarget
            )}`}
            icon={<PiggyBank size={24} />}
          />
        </section>

        <section className="dashboard-grid">
          <div className="left-column">
            <TransactionForm
              form={transactionForm}
              errors={errors.transaction}
              editingId={editingTransactionId}
              onChange={(event) => {
                setTransactionForm((current) => ({
                  ...current,
                  [event.target.name]: event.target.value,
                }));
                clearFieldError("transaction", event.target.name, setErrors);
              }}
              onSubmit={handleTransactionSubmit}
              onCancel={() => {
                setEditingTransactionId(null);
                setTransactionForm(initialTransactionForm);
                clearErrors("transaction");
              }}
            />

            <GoalForm
              form={goalForm}
              errors={errors.goal}
              editingId={editingGoalId}
              onChange={(event) => {
                setGoalForm((current) => ({
                  ...current,
                  [event.target.name]: event.target.value,
                }));
                clearFieldError("goal", event.target.name, setErrors);
              }}
              onSubmit={handleGoalSubmit}
              onCancel={() => {
                setEditingGoalId(null);
                setGoalForm(initialGoalForm);
                clearErrors("goal");
              }}
            />

            <BudgetForm
              form={budgetForm}
              errors={errors.budget}
              editingId={editingBudgetId}
              onChange={(event) => {
                setBudgetForm((current) => ({
                  ...current,
                  [event.target.name]: event.target.value,
                }));
                clearFieldError("budget", event.target.name, setErrors);
              }}
              onSubmit={handleBudgetSubmit}
              onCancel={() => {
                setEditingBudgetId(null);
                setBudgetForm(initialBudgetForm);
                clearErrors("budget");
              }}
            />

            <RecurringForm
              form={recurringForm}
              errors={errors.recurring}
              editingId={editingRecurringId}
              onChange={(event) => {
                const { name, value, type, checked } = event.target;

                setRecurringForm((current) => ({
                  ...current,
                  [name]: type === "checkbox" ? checked : value,
                }));
                clearFieldError("recurring", name, setErrors);
              }}
              onSubmit={handleRecurringSubmit}
              onCancel={() => {
                setEditingRecurringId(null);
                setRecurringForm(initialRecurringForm);
                clearErrors("recurring");
              }}
            />
          </div>

          <section className="right-column">
            <Panel kicker="Monthly summary" title="Insights">
              <div className="insight-list">
                {monthlyInsights.map((insight) => (
                  <p key={insight}>{insight}</p>
                ))}
              </div>
            </Panel>

            <Panel kicker="Spending overview" title="Category breakdown">
              {categoryBreakdown.length === 0 ? (
                <EmptyState text="No expenses for this month yet. Add one or load sample data to preview the dashboard." />
              ) : (
                <div className="category-list">
                  {categoryBreakdown.map((item) => {
                    const barWidth = Math.max(
                      (item.amount / highestCategoryAmount) * 100,
                      8
                    );

                    return (
                      <div className="category-item" key={item.category}>
                        <div className="category-item-header">
                          <span>{item.category}</span>
                          <strong>{formatMoney(item.amount)}</strong>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel kicker="Savings goals" title="Goal tracker">
              {goals.length === 0 ? (
                <EmptyState text="No savings goals yet. Add one to start tracking progress." />
              ) : (
                <div className="goal-list">
                  {goals.map((goal) => {
                    const progress =
                      goal.targetAmount > 0
                        ? Math.min(
                            Math.round(
                              (Number(goal.currentAmount) /
                                Number(goal.targetAmount)) *
                                100
                            ),
                            100
                          )
                        : 0;

                    return (
                      <article className="goal-card" key={goal.id}>
                        <div className="goal-header">
                          <div>
                            <h3>{goal.title}</h3>
                            <p>
                              {formatMoney(goal.currentAmount)} of{" "}
                              {formatMoney(goal.targetAmount)}
                              {goal.deadline
                                ? ` · Deadline: ${formatDate(goal.deadline)}`
                                : ""}
                            </p>
                          </div>

                          <strong>{progress}%</strong>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="card-actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => {
                              setEditingGoalId(goal.id);
                              setGoalForm({
                                title: goal.title,
                                targetAmount: String(goal.targetAmount),
                                currentAmount: String(goal.currentAmount),
                                deadline: goal.deadline,
                              });
                              clearErrors("goal");
                            }}
                            aria-label={`Edit ${goal.title}`}
                          >
                            <Edit3 size={17} />
                          </button>

                          <button
                            type="button"
                            className="icon-button danger"
                            onClick={() => {
                              setGoals((current) =>
                                current.filter((item) => item.id !== goal.id)
                              );
                              showToast("Savings goal deleted.");
                            }}
                            aria-label={`Delete ${goal.title}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel kicker="Budget limits" title="Category budgets">
              {budgetProgress.length === 0 ? (
                <EmptyState text="No category budgets yet. Add one to compare spending against monthly limits." />
              ) : (
                <div className="budget-list">
                  {budgetProgress.map((budget) => (
                    <article
                      className={`budget-card ${
                        budget.isOverBudget ? "over-budget" : ""
                      }`}
                      key={budget.id}
                    >
                      <div className="budget-header">
                        <div>
                          <h3>{budget.category}</h3>
                          <p>
                            {formatMoney(budget.spent)} of{" "}
                            {formatMoney(budget.limit)}
                          </p>
                        </div>

                        <strong>{budget.percentage}%</strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        />
                      </div>

                      <p className="budget-status">
                        {budget.isOverBudget
                          ? `${formatMoney(Math.abs(budget.remaining))} over budget`
                          : `${formatMoney(budget.remaining)} remaining`}
                      </p>

                      <div className="card-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => {
                            setEditingBudgetId(budget.id);
                            setBudgetForm({
                              category: budget.category,
                              limit: String(budget.limit),
                            });
                            clearErrors("budget");
                          }}
                          aria-label={`Edit ${budget.category} budget`}
                        >
                          <Edit3 size={17} />
                        </button>

                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => {
                            setBudgets((current) =>
                              current.filter((item) => item.id !== budget.id)
                            );
                            showToast("Category budget deleted.");
                          }}
                          aria-label={`Delete ${budget.category} budget`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              kicker="Recurring payments"
              title={`Monthly total: ${formatMoney(activeRecurringTotal)}`}
            >
              {recurringPayments.length === 0 ? (
                <EmptyState text="No recurring payments yet. Add rent, subscriptions, bills, or other monthly goblins." />
              ) : (
                <div className="recurring-list">
                  {recurringPayments.map((payment) => (
                    <article
                      className={`recurring-card ${
                        !payment.isActive ? "inactive" : ""
                      }`}
                      key={payment.id}
                    >
                      <div>
                        <h3>{payment.title}</h3>
                        <p>
                          {formatMoney(payment.amount)} · {payment.category} · due
                          day {payment.dueDay}
                        </p>
                        {payment.note && <p>{payment.note}</p>}
                      </div>

                      <div className="card-actions">
                        <button
                          type="button"
                          className="mini-button"
                          onClick={() => addRecurringToSelectedMonth(payment)}
                          disabled={!payment.isActive}
                        >
                          Add to month
                        </button>

                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => {
                            setEditingRecurringId(payment.id);
                            setRecurringForm({
                              title: payment.title,
                              amount: String(payment.amount),
                              category: payment.category,
                              dueDay: String(payment.dueDay),
                              note: payment.note,
                              isActive: payment.isActive,
                            });
                            clearErrors("recurring");
                          }}
                          aria-label={`Edit ${payment.title}`}
                        >
                          <Edit3 size={17} />
                        </button>

                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => {
                            setRecurringPayments((current) =>
                              current.filter((item) => item.id !== payment.id)
                            );
                            showToast("Recurring payment deleted.");
                          }}
                          aria-label={`Delete ${payment.title}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              kicker="Money log"
              title={`Transactions for ${formatMonthLabel(selectedMonth)}`}
              helper={`${monthlyTransactions.length} result${
                monthlyTransactions.length === 1 ? "" : "s"
              }`}
            >
              <div className="search-wrapper">
                <Search size={18} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by title, category, or note..."
                />
              </div>

              {monthlyTransactions.length === 0 ? (
                <EmptyState text="No transactions found. The goblin ledger is empty." />
              ) : (
                <div className="transaction-list">
                  {monthlyTransactions.map((transaction) => (
                    <article className="transaction-card" key={transaction.id}>
                      <div className="transaction-main">
                        <div className="transaction-title-row">
                          <h3>{transaction.title}</h3>
                          <span className="pill">{transaction.category}</span>
                          <span className={`pill ${transaction.type}`}>
                            {transaction.type}
                          </span>
                        </div>

                        <p className="transaction-meta">
                          {formatDate(transaction.date)}
                          {transaction.note ? ` · ${transaction.note}` : ""}
                        </p>
                      </div>

                      <div className="transaction-side">
                        <strong className={`amount ${transaction.type}`}>
                          {transaction.type === "income" ? "+" : "-"}
                          {formatMoney(transaction.amount)}
                        </strong>

                        <div className="card-actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => {
                              setEditingTransactionId(transaction.id);
                              setTransactionForm({
                                title: transaction.title,
                                type: transaction.type,
                                category: transaction.category,
                                amount: String(transaction.amount),
                                date: transaction.date,
                                note: transaction.note,
                              });
                              clearErrors("transaction");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            aria-label={`Edit ${transaction.title}`}
                          >
                            <Edit3 size={17} />
                          </button>

                          <button
                            type="button"
                            className="icon-button danger"
                            onClick={() => {
                              setTransactions((current) =>
                                current.filter(
                                  (item) => item.id !== transaction.id
                                )
                              );
                              showToast("Transaction deleted.");
                            }}
                            aria-label={`Delete ${transaction.title}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Panel>
          </section>
        </section>
      </section>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {isClearModalOpen && (
        <ConfirmModal
          title="Clear all data?"
          message="This will permanently remove all transactions, goals, budgets, and recurring payments from this browser."
          confirmText="Yes, clear everything"
          cancelText="Keep my data"
          onConfirm={handleConfirmClearAllData}
          onCancel={() => setIsClearModalOpen(false)}
        />
      )}
    </main>
  );
}

function TransactionForm({ form, errors, editingId, onChange, onSubmit, onCancel }) {
  return (
    <form className="panel" onSubmit={onSubmit} noValidate>
      <FormHeading
        kicker={editingId ? "Editing transaction" : "Money log"}
        title={editingId ? "Update transaction" : "Add transaction"}
        onCancel={editingId ? onCancel : null}
      />

      <div className="form-grid">
        <FieldError error={errors.title}>
          <label>
            Title
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="e.g. Groceries, paycheck, rent"
            />
          </label>
        </FieldError>

        <div className="form-row">
          <label>
            Type
            <select name="type" value={form.type} onChange={onChange}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>

          <label>
            Category
            <select name="category" value={form.category} onChange={onChange}>
              {transactionCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <FieldError error={errors.amount}>
            <label>
              Amount
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={onChange}
                placeholder="0.00"
              />
            </label>
          </FieldError>

          <FieldError error={errors.date}>
            <label>
              Date
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={onChange}
              />
            </label>
          </FieldError>
        </div>

        <label>
          Note
          <textarea
            name="note"
            value={form.note}
            onChange={onChange}
            placeholder="Optional tiny money confession"
          />
        </label>

        <button className="primary-button" type="submit">
          <Plus size={18} />
          {editingId ? "Save transaction" : "Add transaction"}
        </button>
      </div>
    </form>
  );
}

function GoalForm({ form, errors, editingId, onChange, onSubmit, onCancel }) {
  return (
    <form className="panel" onSubmit={onSubmit} noValidate>
      <FormHeading
        kicker={editingId ? "Editing goal" : "Savings plan"}
        title={editingId ? "Update goal" : "Add savings goal"}
        onCancel={editingId ? onCancel : null}
      />

      <div className="form-grid">
        <FieldError error={errors.title}>
          <label>
            Goal name
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="e.g. Emergency fund, trip, laptop"
            />
          </label>
        </FieldError>

        <div className="form-row">
          <FieldError error={errors.targetAmount}>
            <label>
              Target amount
              <input
                name="targetAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.targetAmount}
                onChange={onChange}
                placeholder="1000"
              />
            </label>
          </FieldError>

          <FieldError error={errors.currentAmount}>
            <label>
              Current amount
              <input
                name="currentAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.currentAmount}
                onChange={onChange}
                placeholder="250"
              />
            </label>
          </FieldError>
        </div>

        <label>
          Deadline
          <input
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={onChange}
          />
        </label>

        <button className="primary-button" type="submit">
          <PiggyBank size={18} />
          {editingId ? "Save goal" : "Add goal"}
        </button>
      </div>
    </form>
  );
}

function BudgetForm({ form, errors, editingId, onChange, onSubmit, onCancel }) {
  return (
    <form className="panel" onSubmit={onSubmit} noValidate>
      <FormHeading
        kicker={editingId ? "Editing budget" : "Monthly limits"}
        title={editingId ? "Update category budget" : "Add category budget"}
        onCancel={editingId ? onCancel : null}
      />

      <div className="form-grid">
        <label>
          Category
          <select name="category" value={form.category} onChange={onChange}>
            {transactionCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <FieldError error={errors.limit}>
          <label>
            Monthly limit
            <input
              name="limit"
              type="number"
              min="0"
              step="0.01"
              value={form.limit}
              onChange={onChange}
              placeholder="250"
            />
          </label>
        </FieldError>

        <button className="primary-button" type="submit">
          <Plus size={18} />
          {editingId ? "Save budget" : "Add budget"}
        </button>
      </div>
    </form>
  );
}

function RecurringForm({ form, errors, editingId, onChange, onSubmit, onCancel }) {
  return (
    <form className="panel" onSubmit={onSubmit} noValidate>
      <FormHeading
        kicker={editingId ? "Editing recurring payment" : "Recurring payments"}
        title={editingId ? "Update recurring payment" : "Add recurring payment"}
        onCancel={editingId ? onCancel : null}
      />

      <div className="form-grid">
        <FieldError error={errors.title}>
          <label>
            Payment name
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="e.g. Rent, phone bill, subscription"
            />
          </label>
        </FieldError>

        <div className="form-row">
          <FieldError error={errors.amount}>
            <label>
              Amount
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={onChange}
                placeholder="25"
              />
            </label>
          </FieldError>

          <FieldError error={errors.dueDay}>
            <label>
              Due day
              <input
                name="dueDay"
                type="number"
                min="1"
                max="31"
                value={form.dueDay}
                onChange={onChange}
                placeholder="1"
              />
            </label>
          </FieldError>
        </div>

        <label>
          Category
          <select name="category" value={form.category} onChange={onChange}>
            {transactionCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Note
          <textarea
            name="note"
            value={form.note}
            onChange={onChange}
            placeholder="Optional note"
          />
        </label>

        <label className="checkbox-label">
          <input
            name="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={onChange}
          />
          Active recurring payment
        </label>

        <button className="primary-button" type="submit">
          <Plus size={18} />
          {editingId ? "Save recurring payment" : "Add recurring payment"}
        </button>
      </div>
    </form>
  );
}

function FormHeading({ kicker, title, onCancel }) {
  return (
    <div className="panel-heading">
      <div>
        <p className="section-kicker">{kicker}</p>
        <h2>{title}</h2>
      </div>

      {onCancel && (
        <button className="ghost-button compact" type="button" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
}

function FieldError({ error, children }) {
  return (
    <div className={error ? "field-wrapper has-error" : "field-wrapper"}>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function Panel({ kicker, title, helper, children }) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h2>{title}</h2>
          {helper && <p className="muted">{helper}</p>}
        </div>
      </div>

      {children}
    </div>
  );
}

function StatCard({ title, value, description, icon, isNegative = false }) {
  return (
    <article className={`stat-card ${isNegative ? "negative" : ""}`}>
      <div className="stat-icon">{icon}</div>
      <p>{title}</p>
      <h2>{value}</h2>
      <span>{description}</span>
    </article>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

function Toast({ message, type }) {
  return (
    <div className={`toast ${type === "error" ? "error" : "success"}`}>
      {message}
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <button
          type="button"
          className="modal-close-button"
          onClick={onCancel}
          aria-label="Close confirmation modal"
        >
          <X size={18} />
        </button>

        <h2>{title}</h2>
        <p>{message}</p>

        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onCancel}>
            {cancelText}
          </button>

          <button type="button" className="danger-button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function validateTransactionForm(form) {
  const errors = {};

  if (!form.title.trim()) {
    errors.title = "Please add a title.";
  }

  if (!form.amount || Number(form.amount) <= 0) {
    errors.amount = "Please enter an amount greater than 0.";
  }

  if (!form.date) {
    errors.date = "Please choose a date.";
  }

  return errors;
}

function validateGoalForm(form) {
  const errors = {};

  if (!form.title.trim()) {
    errors.title = "Please add a goal name.";
  }

  if (!form.targetAmount || Number(form.targetAmount) <= 0) {
    errors.targetAmount = "Target amount must be greater than 0.";
  }

  if (form.currentAmount === "" || Number(form.currentAmount) < 0) {
    errors.currentAmount = "Current amount cannot be negative.";
  }

  if (
    form.targetAmount &&
    form.currentAmount &&
    Number(form.currentAmount) > Number(form.targetAmount)
  ) {
    errors.currentAmount = "Current amount cannot be higher than the target.";
  }

  return errors;
}

function validateBudgetForm(form) {
  const errors = {};

  if (!form.limit || Number(form.limit) <= 0) {
    errors.limit = "Monthly limit must be greater than 0.";
  }

  return errors;
}

function validateRecurringForm(form) {
  const errors = {};

  if (!form.title.trim()) {
    errors.title = "Please add a payment name.";
  }

  if (!form.amount || Number(form.amount) <= 0) {
    errors.amount = "Amount must be greater than 0.";
  }

  if (!form.dueDay || Number(form.dueDay) < 1 || Number(form.dueDay) > 31) {
    errors.dueDay = "Due day must be between 1 and 31.";
  }

  return errors;
}

function clearFieldError(section, field, setErrors) {
  setErrors((currentErrors) => {
    const updatedSectionErrors = { ...currentErrors[section] };
    delete updatedSectionErrors[field];

    return {
      ...currentErrors,
      [section]: updatedSectionErrors,
    };
  });
}

function isValidImportData(data) {
  if (!data || typeof data !== "object") return false;

  return (
    Array.isArray(data.transactions || []) &&
    Array.isArray(data.goals || []) &&
    Array.isArray(data.budgets || []) &&
    Array.isArray(data.recurringPayments || [])
  );
}

function loadFromStorage(key, fallbackValue) {
  const savedData = localStorage.getItem(key);

  if (!savedData) return fallbackValue;

  try {
    return JSON.parse(savedData);
  } catch {
    return fallbackValue;
  }
}

function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function getMonthKey(dateString) {
  return dateString.slice(0, 7);
}

function getDateForDueDay(monthKey, dueDay) {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(Number(dueDay), lastDay);

  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(
    2,
    "0"
  )}`;
}

function formatCurrency(value, currencyCode = "EUR") {
  const selectedCurrency =
    currencyOptions.find((currency) => currency.code === currencyCode) ||
    currencyOptions[0];

  return new Intl.NumberFormat(selectedCurrency.locale, {
    style: "currency",
    currency: selectedCurrency.code,
  }).format(value || 0);
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1);

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

export default App;