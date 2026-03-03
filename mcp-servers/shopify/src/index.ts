#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration from environment variables
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const API_VERSION = "2024-10";

// Helper to make Shopify API requests
async function shopifyFetch(endpoint: string, params?: Record<string, string>): Promise<any> {
  if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_SHOP_DOMAIN) {
    throw new Error("Shopify not configured");
  }

  const url = new URL(`https://${SHOPIFY_SHOP_DOMAIN}/admin/api/${API_VERSION}/${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Define tools
const tools: Tool[] = [
  {
    name: "get_shop_info",
    description: "Get basic information about the Shopify store",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "list_orders",
    description: "List orders from Shopify. Can filter by status and date.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filter: 'open', 'closed', 'cancelled', 'any' (default: any)" },
        fulfillment_status: { type: "string", description: "Filter: 'shipped', 'partial', 'unshipped', 'unfulfilled'" },
        financial_status: { type: "string", description: "Filter: 'paid', 'unpaid', 'pending', 'refunded'" },
        created_at_min: { type: "string", description: "Orders created after this date (ISO 8601)" },
        created_at_max: { type: "string", description: "Orders created before this date (ISO 8601)" },
        limit: { type: "number", description: "Max results (default: 50, max: 250)" },
      },
    },
  },
  {
    name: "get_order",
    description: "Get details for a specific order by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        order_id: { type: "string", description: "The order ID" },
      },
      required: ["order_id"],
    },
  },
  {
    name: "list_products",
    description: "List products from Shopify",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filter: 'active', 'archived', 'draft'" },
        limit: { type: "number", description: "Max results (default: 50, max: 250)" },
      },
    },
  },
  {
    name: "get_product",
    description: "Get details for a specific product by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        product_id: { type: "string", description: "The product ID" },
      },
      required: ["product_id"],
    },
  },
  {
    name: "list_customers",
    description: "List customers from Shopify",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max results (default: 50, max: 250)" },
        created_at_min: { type: "string", description: "Customers created after this date" },
      },
    },
  },
  {
    name: "get_inventory",
    description: "Get inventory levels for products",
    inputSchema: {
      type: "object" as const,
      properties: {
        location_id: { type: "string", description: "Filter by location ID" },
        limit: { type: "number", description: "Max results (default: 50)" },
      },
    },
  },
  {
    name: "list_locations",
    description: "List all store locations",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_analytics_summary",
    description: "Get a summary of recent store activity (orders, revenue)",
    inputSchema: {
      type: "object" as const,
      properties: {
        days: { type: "number", description: "Number of days to look back (default: 7)" },
      },
    },
  },
];

// Format order for display
function formatOrder(order: any): string {
  const items = order.line_items?.map((item: any) =>
    `  - ${item.name} x${item.quantity} ($${item.price})`
  ).join("\n") || "";

  return `Order ${order.name} (${order.id})
  Customer: ${order.customer?.first_name || ""} ${order.customer?.last_name || ""} <${order.email || "N/A"}>
  Date: ${order.created_at}
  Total: $${order.total_price} ${order.currency}
  Financial: ${order.financial_status} | Fulfillment: ${order.fulfillment_status || "unfulfilled"}
  Items:
${items}`;
}

// Format product for display
function formatProduct(product: any): string {
  const variants = product.variants?.map((v: any) =>
    `  - ${v.title}: $${v.price} (Stock: ${v.inventory_quantity || "N/A"})`
  ).join("\n") || "";

  return `${product.title} (${product.id})
  Status: ${product.status}
  Vendor: ${product.vendor}
  Type: ${product.product_type || "N/A"}
  Variants:
${variants}`;
}

// Create server
const server = new Server(
  { name: "shopify-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case "get_shop_info": {
        const data = await shopifyFetch("shop.json");
        const shop = data.shop;
        result = `Shop: ${shop.name}
Domain: ${shop.domain}
Email: ${shop.email}
Currency: ${shop.currency}
Owner: ${shop.shop_owner}
Plan: ${shop.plan_display_name}
Country: ${shop.country_name}
Timezone: ${shop.timezone}`;
        break;
      }

      case "list_orders": {
        const params: Record<string, string> = { status: "any" };
        if (args?.status) params.status = args.status as string;
        if (args?.fulfillment_status) params.fulfillment_status = args.fulfillment_status as string;
        if (args?.financial_status) params.financial_status = args.financial_status as string;
        if (args?.created_at_min) params.created_at_min = args.created_at_min as string;
        if (args?.created_at_max) params.created_at_max = args.created_at_max as string;
        params.limit = String(args?.limit || 50);

        const data = await shopifyFetch("orders.json", params);
        if (!data.orders?.length) {
          result = "No orders found.";
        } else {
          result = `Found ${data.orders.length} orders:\n\n` +
            data.orders.map(formatOrder).join("\n\n---\n\n");
        }
        break;
      }

      case "get_order": {
        const data = await shopifyFetch(`orders/${args?.order_id}.json`);
        result = formatOrder(data.order);
        break;
      }

      case "list_products": {
        const params: Record<string, string> = {};
        if (args?.status) params.status = args.status as string;
        params.limit = String(args?.limit || 50);

        const data = await shopifyFetch("products.json", params);
        if (!data.products?.length) {
          result = "No products found.";
        } else {
          result = `Found ${data.products.length} products:\n\n` +
            data.products.map(formatProduct).join("\n\n---\n\n");
        }
        break;
      }

      case "get_product": {
        const data = await shopifyFetch(`products/${args?.product_id}.json`);
        result = formatProduct(data.product);
        break;
      }

      case "list_customers": {
        const params: Record<string, string> = {};
        if (args?.created_at_min) params.created_at_min = args.created_at_min as string;
        params.limit = String(args?.limit || 50);

        const data = await shopifyFetch("customers.json", params);
        if (!data.customers?.length) {
          result = "No customers found.";
        } else {
          result = `Found ${data.customers.length} customers:\n\n` +
            data.customers.map((c: any) =>
              `${c.first_name || ""} ${c.last_name || ""} <${c.email}> - Orders: ${c.orders_count}, Total spent: $${c.total_spent}`
            ).join("\n");
        }
        break;
      }

      case "get_inventory": {
        const params: Record<string, string> = {};
        if (args?.location_id) params.location_ids = args.location_id as string;
        params.limit = String(args?.limit || 50);

        const data = await shopifyFetch("inventory_levels.json", params);
        if (!data.inventory_levels?.length) {
          result = "No inventory data found.";
        } else {
          result = `Inventory levels:\n` +
            data.inventory_levels.map((inv: any) =>
              `Item ${inv.inventory_item_id}: ${inv.available} available at location ${inv.location_id}`
            ).join("\n");
        }
        break;
      }

      case "list_locations": {
        const data = await shopifyFetch("locations.json");
        if (!data.locations?.length) {
          result = "No locations found.";
        } else {
          result = `Store locations:\n\n` +
            data.locations.map((loc: any) =>
              `${loc.name} (${loc.id})\n  ${loc.address1}, ${loc.city}, ${loc.country}`
            ).join("\n\n");
        }
        break;
      }

      case "get_analytics_summary": {
        const days = (args?.days as number) || 7;
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - days);

        const params: Record<string, string> = {
          status: "any",
          created_at_min: minDate.toISOString(),
          limit: "250",
        };

        const data = await shopifyFetch("orders.json", params);
        const orders = data.orders || [];

        const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || 0), 0);
        const paidOrders = orders.filter((o: any) => o.financial_status === "paid");
        const unfulfilledOrders = orders.filter((o: any) => !o.fulfillment_status || o.fulfillment_status === "unfulfilled");

        result = `📊 SHOPIFY ANALYTICS (Last ${days} days)

Orders: ${orders.length} total
Revenue: $${totalRevenue.toFixed(2)}
Paid: ${paidOrders.length} orders
Unfulfilled: ${unfulfilledOrders.length} orders
Average order: $${orders.length ? (totalRevenue / orders.length).toFixed(2) : "0.00"}`;
        break;
      }

      default:
        result = `Unknown tool: ${name}`;
    }

    return { content: [{ type: "text", text: result }] };
  } catch (error: any) {
    return { content: [{ type: "text", text: `❌ Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Shopify MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
