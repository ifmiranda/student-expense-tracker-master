// ExpenseScreen.js
import ExpensesChart from './components/ExpensesChart.js';
import React, { useEffect, useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

export default function ExpenseScreen() {
  const db = useSQLiteContext();

  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL | WEEK | MONTH
  const [editingExpense, setEditingExpense] = useState(null);

    const getChartData = () => {
    const totalsByCategory = {};

    expenses.forEach((expense) => {
      const category = expense.category || 'Other';
      const amount = Number(expense.amount) || 0;

      if (!totalsByCategory[category]) {
        totalsByCategory[category] = 0;
      }

      totalsByCategory[category] += amount;
    });

    return {
      labels: Object.keys(totalsByCategory),
      values: Object.values(totalsByCategory),
    };
  };

const { labels, values } = getChartData();



  // Load all expenses from SQLite
  const loadExpenses = async () => {
    const rows = await db.getAllAsync(
      'SELECT * FROM expenses ORDER BY id DESC;'
    );
    setExpenses(rows);
  };

  // Create table (with date column) and load data
  useEffect(() => {
    async function setup() {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL
        );
      `);

      await loadExpenses();
    }

    setup();
  }, []);

  // Add a new expense
  const addExpense = async () => {
    const amountNumber = parseFloat(amount);

    if (isNaN(amountNumber) || amountNumber <= 0) {
      return;
    }

    const trimmedCategory = category.trim();
    const trimmedNote = note.trim();

    if (!trimmedCategory) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    await db.runAsync(
      `INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?)`,
      [amountNumber, trimmedCategory, trimmedNote, today]
    );

    setAmount('');
    setCategory('');
    setNote('');
    await loadExpenses();
  };

  // Delete an expense
  const deleteExpense = async (id) => {
    await db.runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);
    await loadExpenses();
  };

  // --- Date helpers for filters ---
  const isSameMonth = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth()
    );
  };

  const isSameWeek = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();

    const getWeekStart = (date) => {
      const day = date.getDay(); // 0 = Sun
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
      return new Date(date.getFullYear(), date.getMonth(), diff);
    };

    return (
      getWeekStart(d).toDateString() === getWeekStart(now).toDateString()
    );
  };

  // Filter expenses based on selected filter
  const filteredExpenses = useMemo(() => {
    if (filter === 'ALL') return expenses;
    if (filter === 'WEEK') return expenses.filter((e) => isSameWeek(e.date));
    if (filter === 'MONTH') return expenses.filter((e) => isSameMonth(e.date));
    return expenses;
  }, [expenses, filter]);

  // Overall total
  const totalSpending = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Totals by category
  const totalsByCategory = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((e) => {
      if (!map[e.category]) map[e.category] = 0;
      map[e.category] += e.amount;
    });
    return map;
  }, [filteredExpenses]);

  // Save edits
  const handleSaveEdit = async () => {
    if (!editingExpense) return;

    await db.runAsync(
      `
      UPDATE expenses
      SET amount = ?, category = ?, note = ?, date = ?
      WHERE id = ?;
      `,
      [
        editingExpense.amount,
        editingExpense.category,
        editingExpense.note || '',
        editingExpense.date,
        editingExpense.id,
      ]
    );

    await loadExpenses();
    setEditingExpense(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Student Expense Tracker</Text>
          <ExpensesChart labels={labels} values={values} />


      {/* Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Amount (e.g. 12.50)"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <TextInput
          style={styles.input}
          placeholder="Category (Food, Books, Rent...)"
          placeholderTextColor="#9ca3af"
          value={category}
          onChangeText={setCategory}
        />

        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          placeholderTextColor="#9ca3af"
          value={note}
          onChangeText={setNote}
        />

        <Button title="Add Expense" onPress={addExpense} />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <Button title="All" onPress={() => setFilter('ALL')} />
        <Button title="This Week" onPress={() => setFilter('WEEK')} />
        <Button title="This Month" onPress={() => setFilter('MONTH')} />
      </View>

      {/* Totals */}
      <Text style={styles.totalText}>
        Total: ${totalSpending.toFixed(2)}
      </Text>

      <View style={styles.categoryTotals}>
        <Text style={styles.sectionHeading}>By Category:</Text>
        {Object.entries(totalsByCategory).map(([cat, total]) => (
          <Text key={cat} style={styles.categoryTotalText}>
            {cat}: ${total.toFixed(2)}
          </Text>
        ))}
      </View>

      {/* List */}
      <FlatList
        style={styles.list}
        data={filteredExpenses}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses yet. Add one above.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.expenseRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
              <Text style={styles.expenseCategory}>{item.category}</Text>
              {item.note ? (
                <Text style={styles.expenseNote}>{item.note}</Text>
              ) : null}
              <Text style={styles.expenseDate}>{item.date}</Text>
            </View>

            <View style={{ justifyContent: 'center' }}>
              <Button title="Edit" onPress={() => setEditingExpense(item)} />
              <TouchableOpacity
                onPress={() => deleteExpense(item.id)}
                style={{ marginTop: 8 }}
              >
                <Text style={styles.delete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Edit form (simple inline version) */}
      {editingExpense && (
        <View style={styles.editPanel}>
          <Text style={styles.sectionHeading}>Edit Expense</Text>

          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(editingExpense.amount)}
            onChangeText={(text) =>
              setEditingExpense({
                ...editingExpense,
                amount: Number(text),
              })
            }
          />

          <TextInput
            style={styles.input}
            value={editingExpense.category}
            onChangeText={(text) =>
              setEditingExpense({ ...editingExpense, category: text })
            }
          />

          <TextInput
            style={styles.input}
            value={editingExpense.note || ''}
            onChangeText={(text) =>
              setEditingExpense({ ...editingExpense, note: text })
            }
          />

          {/* keep same date, or you could add date editing later */}
          <View style={styles.editButtons}>
            <Button title="Save" onPress={handleSaveEdit} />
            <Button
              title="Cancel"
              onPress={() => setEditingExpense(null)}
              color="#6b7280"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  totalText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoryTotals: {
    marginBottom: 8,
  },
  sectionHeading: {
    color: '#e5e7eb',
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryTotalText: {
    color: '#e5e7eb',
    fontSize: 14,
  },
  list: {
    flex: 1,
    marginTop: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fbbf24',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  expenseNote: {
    fontSize: 12,
    color: '#9ca3af',
  },
  expenseDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  delete: {
    color: '#f87171',
    fontSize: 14,
  },
  empty: {
    color: '#9ca3af',
    marginTop: 24,
    textAlign: 'center',
  },
  editPanel: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
































































































































































































