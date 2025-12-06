// components/ExpensesChart.js
import React from 'react';
import { View, Text } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

export default function ExpensesChart({ labels, values }) {
  return (
    <View style={{ padding: 16 }}>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 8,
        }}
      >
        Spending by Category
      </Text>

      <BarChart
        data={{
          labels: labels,
          datasets: [{ data: values }],
        }}
        width={350}   // you can adjust this if needed
        height={220}
        fromZero
        chartConfig={{
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          color: () => 'black',
          labelColor: () => 'black',
        }}
        style={{ borderRadius: 12 }}
      />
    </View>
  );
}

































