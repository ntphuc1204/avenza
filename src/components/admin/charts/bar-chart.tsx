"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface BarChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  height?: number;
}

const BarChart = ({
  data,
  title,
  xLabel = "Danh mục",
  yLabel = "Giá trị",
  height = 300,
}: BarChartProps) => {
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: yLabel,
        data: data.map((item) => item.value),
        backgroundColor: "rgba(24, 144, 255, 0.7)",
        borderColor: "rgb(24, 144, 255)",
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 14,
          weight: "bold",
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: yLabel,
        },
      },
      y: {
        title: {
          display: true,
          text: xLabel,
        },
      },
    },
  };

  return (
    <div style={{ position: "relative", height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarChart;
