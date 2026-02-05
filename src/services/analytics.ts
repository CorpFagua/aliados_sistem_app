// src/services/analytics.ts
import { api, authHeaders } from "@/lib/api";

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
}

export interface DeliveryPersonStat {
  deliveryId: string;
  deliveryName: string;
  deliveryPhone?: string;
  totalDeliveries: number;
  totalEarnings: number;
  totalOwed: number;
  netProfit: number;
  percentageOfTotal: number;
}

export interface StoreStat {
  storeId: string;
  storeName: string;
  storeAdmin?: string;
  serviceType?: string;
  totalServices: number;
  totalEarnings: number;
  totalOwed: number;
  netProfit: number;
  percentageOfTotal: number;
}

export interface ZoneStat {
  zoneId: string;
  zoneName: string;
  totalServices: number;
}

export interface DetailedService {
  serviceId: string;
  storeName: string;
  storeAdmin: string;
  serviceType?: string;
  deliveryName: string;
  deliveryPhone?: string;
  zoneName: string;
  price: number;
  priceDeliverySrv: number;
  status: string;
  completedAt?: string;
  notes?: string;
}

export interface AnalyticsResponse {
  summary: {
    totalEarnings: number;
    totalOwed: number;
    netProfit: number;
    totalDeliveries: number;
    startDate: string;
    endDate: string;
  };
  deliveryPersonStats: DeliveryPersonStat[];
  storeStats: StoreStat[];
  zoneStats: ZoneStat[];
  detailedServices: DetailedService[];
}

export async function fetchAnalytics(
  token: string,
  query?: AnalyticsQuery
): Promise<AnalyticsResponse> {
  try {
    const params = new URLSearchParams();
    if (query?.startDate) params.append("startDate", query.startDate);
    if (query?.endDate) params.append("endDate", query.endDate);

    const res = await api.get<{ ok: boolean; data: AnalyticsResponse }>(
      `/analytics?${params.toString()}`,
      {
        headers: authHeaders(token),
      }
    );

    return res.data.data;
  } catch (err: any) {
    console.error(
      "❌ Error fetching analytics:",
      err.response?.data || err.message
    );
    throw err;
  }
}
