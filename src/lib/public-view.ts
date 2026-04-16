import type { Animal, MediaAsset } from '@schemas';

const PRIVATE_ANIMAL_KEYS = [
  'soldTo',
  'saleMethod',
  'saleDate',
  'saleNotes',
  'removalDate',
  'removalReason',
  'pregnancySetDate',
] as const;

type PrivateAnimalKey = (typeof PRIVATE_ANIMAL_KEYS)[number];

type BaseOmit = Omit<Animal, PrivateAnimalKey | 'sourceRanch' | 'acquisitionMethod'>;

export type PublicAnimal = BaseOmit & {
  sourceRanch: string | null;
  acquisitionMethod: Animal['acquisitionMethod'];
};

export function toPublicAnimal(animal: Animal): PublicAnimal {
  const {
    soldTo: _soldTo,
    saleMethod: _saleMethod,
    saleDate: _saleDate,
    saleNotes: _saleNotes,
    removalDate: _removalDate,
    removalReason: _removalReason,
    pregnancySetDate: _pregnancySetDate,
    sourceRanch,
    acquisitionMethod,
    showSourcePublicly,
    ...rest
  } = animal;

  return {
    ...rest,
    showSourcePublicly,
    sourceRanch: showSourcePublicly ? sourceRanch : null,
    acquisitionMethod: showSourcePublicly ? acquisitionMethod : null,
  };
}

export type PublicMediaAsset = Omit<MediaAsset, 'privateMetadata'> & {
  capturedAt: string | null;
  dimensions: MediaAsset['privateMetadata']['dimensions'];
};

export function toPublicMedia(media: MediaAsset): PublicMediaAsset {
  const { privateMetadata, ...rest } = media;
  return {
    ...rest,
    dimensions: privateMetadata.dimensions,
  };
}

export function isPublicEligible(media: MediaAsset): boolean {
  return media.publicEligible && !media.hidden && !media.deleted && media.state === 'published';
}
