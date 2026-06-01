import type { MetadataRoute } from "next";
import {
  getAllCollectionHandles,
  getAllProductHandles,
  getSiteUrl,
} from "@/lib/shopifySeo";

export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const [products, collections] = await Promise.all([
    getAllProductHandles(500),
    getAllCollectionHandles(250),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/categorias`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/contacto`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/policies/privacy-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${siteUrl}/policies/refund-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${siteUrl}/policies/shipping-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${siteUrl}/policies/terms-of-service`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
  ];

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/products/${product.handle}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const categoryEntries: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: `${siteUrl}/categorias/${collection.handle}`,
    lastModified: collection.updatedAt ? new Date(collection.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries, ...categoryEntries];
}
