import { permanentRedirect } from "next/navigation";

export const revalidate = 1800;

export default function LegacyProductoPage({
  params,
}: {
  params: { handle: string };
}) {
  permanentRedirect(`/products/${params.handle}`);
}
