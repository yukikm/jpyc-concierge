import type { Product, ProductSearchParams, ProductSearchResponse } from "@/types/product";

const RAKUTEN_API_ENDPOINT =
  "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

interface RakutenItem {
  itemName: string;
  itemPrice: number;
  mediumImageUrls: Array<{ imageUrl: string }>;
  itemUrl: string;
  itemCaption?: string;
  shopName: string;
}

interface RakutenApiResponse {
  Items: Array<{ Item: RakutenItem }>;
  hits: number;
  count: number;
}

export async function searchProducts(
  params: ProductSearchParams
): Promise<ProductSearchResponse> {
  const appId = process.env.RAKUTEN_APP_ID;

  if (!appId) {
    console.warn("RAKUTEN_APP_ID is not set. Returning mock data.");
    return getMockProducts(params);
  }

  const searchParams = new URLSearchParams({
    applicationId: appId,
    keyword: params.keyword,
    hits: "10",
    page: String(params.page || 1),
    format: "json",
  });

  if (params.maxPrice) {
    searchParams.set("maxPrice", String(params.maxPrice));
  }

  try {
    const response = await fetch(
      `${RAKUTEN_API_ENDPOINT}?${searchParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Rakuten API error: ${response.status}`);
    }

    const data: RakutenApiResponse = await response.json();

    const products: Product[] = data.Items.map(({ Item }) => ({
      name: Item.itemName,
      price: Item.itemPrice,
      imageUrl: Item.mediumImageUrls[0]?.imageUrl || "",
      itemUrl: Item.itemUrl,
      description: Item.itemCaption,
      shopName: Item.shopName,
    }));

    return {
      products,
      total: data.count,
    };
  } catch (error) {
    console.error("Rakuten API error:", error);
    throw error;
  }
}

function getMockProducts(params: ProductSearchParams): ProductSearchResponse {
  const mockProducts: Product[] = [
    {
      name: `${params.keyword} - サンプル商品 1`,
      price: Math.min(params.maxPrice || 1000, 980),
      imageUrl: "https://placehold.co/300x300/png?text=Product+1",
      itemUrl: "https://www.rakuten.co.jp/",
      description: "サンプル商品の説明文です。",
      shopName: "サンプルショップ",
    },
    {
      name: `${params.keyword} - サンプル商品 2`,
      price: Math.min(params.maxPrice || 2000, 1980),
      imageUrl: "https://placehold.co/300x300/png?text=Product+2",
      itemUrl: "https://www.rakuten.co.jp/",
      description: "サンプル商品の説明文です。",
      shopName: "サンプルショップ 2",
    },
    {
      name: `${params.keyword} - サンプル商品 3`,
      price: Math.min(params.maxPrice || 3000, 2980),
      imageUrl: "https://placehold.co/300x300/png?text=Product+3",
      itemUrl: "https://www.rakuten.co.jp/",
      description: "サンプル商品の説明文です。",
      shopName: "サンプルショップ 3",
    },
  ];

  return {
    products: mockProducts,
    total: mockProducts.length,
  };
}
