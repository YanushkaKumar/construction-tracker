import { NotFoundException } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

describe('StorageController — presigned download tenant scoping', () => {
  let controller: StorageController;
  const service = {
    getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://signed.example/x'),
    generateKey: jest.fn(),
  } as unknown as StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new StorageController(service);
  });

  it('signs a key inside the caller company', async () => {
    const res = await controller.getPresignedDownloadUrl('company-a/site-images/x.jpg', 'company-a');
    expect(res.url).toBe('https://signed.example/x');
  });

  it('refuses a key belonging to another company', async () => {
    await expect(
      controller.getPresignedDownloadUrl('company-b/site-images/secret.jpg', 'company-a'),
    ).rejects.toThrow(NotFoundException);
    expect(service.getPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('refuses a traversal key that climbs out of the company prefix', async () => {
    await expect(
      controller.getPresignedDownloadUrl('company-a/../company-b/secret.jpg', 'company-a'),
    ).rejects.toThrow(NotFoundException);
    expect(service.getPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('refuses an empty key', async () => {
    await expect(controller.getPresignedDownloadUrl('', 'company-a')).rejects.toThrow(NotFoundException);
  });

  it('refuses a key that merely starts with a similar company id', async () => {
    // "company-a2" must not satisfy the "company-a" prefix check
    await expect(
      controller.getPresignedDownloadUrl('company-a2/site-images/x.jpg', 'company-a'),
    ).rejects.toThrow(NotFoundException);
  });
});
