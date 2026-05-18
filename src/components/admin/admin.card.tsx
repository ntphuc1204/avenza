"use client";

import { Card, Col, Row, Spin } from "antd";
import { useEffect, useState } from "react";
import { sendRequest } from "@/utils/api";
import { useSession } from "next-auth/react";

interface IStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}

const AdminCard = () => {
  const { data: session } = useSession();
  const [statistics, setStatistics] = useState<IStatistics>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const res = await sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
          method: "GET",
          queryParams: {
            current: 1,
            pageSize: 1000,
          },
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
        });

        if (res?.data?.results) {
          const users = res.data.results;
          const activeCount = users.filter((u: any) => u.isActive).length;
          const inactiveCount = users.filter((u: any) => !u.isActive).length;

          setStatistics({
            totalUsers: res.data.meta?.total || users.length,
            activeUsers: activeCount,
            inactiveUsers: inactiveCount,
          });
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.access_token) {
      fetchStatistics();
    }
  }, [session?.user?.access_token]);

  return (
    <Spin spinning={loading}>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="Total Users" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#1890ff" }}>
              {statistics.totalUsers}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Active Users" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>
              {statistics.activeUsers}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Inactive Users" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#ff4d4f" }}>
              {statistics.inactiveUsers}
            </div>
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};

export default AdminCard;
