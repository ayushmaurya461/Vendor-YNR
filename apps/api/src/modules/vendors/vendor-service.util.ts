export interface IVendorServiceItem {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface VendorServiceDto {
  name: string;
  description?: string;
  imageUrl?: string;
}

export function normalizeServicesInput(input: unknown): IVendorServiceItem[] | undefined {
  if (!Array.isArray(input)) {
    return undefined;
  }

  const items: IVendorServiceItem[] = [];
  for (const entry of input) {
    if (typeof entry === 'string') {
      const name = entry.trim();
      if (name.length > 0) {
        items.push({ name });
      }
      continue;
    }

    if (entry && typeof entry === 'object' && 'name' in entry) {
      const raw = entry as { name?: unknown; description?: unknown; imageUrl?: unknown };
      const name = String(raw.name ?? '').trim();
      if (name.length === 0) {
        continue;
      }
      const description =
        typeof raw.description === 'string' && raw.description.trim().length > 0
          ? raw.description.trim()
          : undefined;
      const imageUrl =
        typeof raw.imageUrl === 'string' && raw.imageUrl.trim().length > 0
          ? raw.imageUrl.trim()
          : undefined;
      items.push({ name, description, imageUrl });
    }
  }

  return items.length > 0 ? items : undefined;
}

export function toVendorServiceDtos(
  services?: (string | IVendorServiceItem)[],
): VendorServiceDto[] | undefined {
  if (!services?.length) {
    return undefined;
  }

  const items = services
    .map((entry) => {
      if (typeof entry === 'string') {
        const name = entry.trim();
        return name.length > 0 ? { name } : null;
      }
      const name = entry.name?.trim();
      if (!name) {
        return null;
      }
      return {
        name,
        description: entry.description?.trim() || undefined,
        imageUrl: entry.imageUrl?.trim() || undefined,
      };
    })
    .filter((item): item is VendorServiceDto => item !== null);

  return items.length > 0 ? items : undefined;
}
