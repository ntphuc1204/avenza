"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface ITimeseriesRow {
  period: string;
  orderCount: number;
  revenue: number;
}

interface LineChartProps {
  data: ITimeseriesRow[];
  title?: string;
  height?: number;
}

const LineChart = ({
  data,
  title = "Doanh thu theo thời gian",
  height = 300,
}: LineChartProps) => {
  const chartData = {
    labels: data.map((item) => item.period),
    datasets: [
      {
        label: "Doanh thu (đ)",
        data: data.map((item) => item.revenue),
        borderColor: "rgb(250, 140, 22)",
        backgroundColor: "rgba(250, 140, 22, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: "y",
      },
      {
        label: "Số đơn hàng",
        data: data.map((item) => item.orderCount),
        borderColor: "rgb(24, 144, 255)",
        backgroundColor: "rgba(24, 144, 255, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: "y1",
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
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
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Doanh thu (đ)",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Số đơn hàng",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div style={{ position: "relative", height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LineChart;
