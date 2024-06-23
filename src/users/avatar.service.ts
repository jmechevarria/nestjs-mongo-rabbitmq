import { Injectable } from '@nestjs/common';
import { access, constants } from 'node:fs/promises';
import * as fs from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';

@Injectable()
export class AvatarService {
  async exists(name: string) {
    const path = join('avatars', name);

    try {
      await access(path, constants.R_OK);

      return true;
    } catch (error) {
      return false;
    }
  }

  async save(resourceUrl: string, name: string): Promise<string> {
    if (!(await this.exists('.'))) await fs.mkdir('avatars');

    const response = await fetch(resourceUrl);
    const data = await response.arrayBuffer();

    const path = join('avatars', name);
    await fs.writeFile(path, Buffer.from(data));

    return await this.getHash(path);
  }

  async delete(name: string) {
    if (await this.exists(name)) {
      const path = join('avatars', name);
      await fs.rm(path);
      return true;
    }

    return false;
  }

  private getHash(path: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const hash = createHash('sha256');
      const file = await fs.open(path, 'r');
      const rs = file.createReadStream();
      rs.on('error', reject);
      rs.on('data', (chunk) => hash.update(chunk));
      rs.on('end', () => resolve(hash.digest('hex')));
    });
  }
}
