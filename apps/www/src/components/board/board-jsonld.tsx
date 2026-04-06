import type { BoardDetail } from '@armbian/schemas';
import { ARMBIAN_URLS } from '@armbian/config';

export function BoardJsonLd({ board }: { board: BoardDetail }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `Armbian for ${board.name}`,
    applicationCategory: 'OperatingSystem',
    operatingSystem: 'Linux',
    description: board.summary ?? `Armbian Linux images for ${board.name} by ${board.vendor_name}`,
    url: `${ARMBIAN_URLS.WEBSITE}/boards/${board.slug}`,
    image: board.image_url,
    author: {
      '@type': 'Organization',
      name: 'Armbian',
      url: ARMBIAN_URLS.WEBSITE,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll('</script>', '<\\/script>') }}
    />
  );
}
