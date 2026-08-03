import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getAvatarUploadUrl, getPublicUrl, objectExists } from '../s3.js';

const router = Router();
router.use(requireAuth);

const ALLOWED_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

router.post('/upload-url', async (req, res) => {
  const { contentType } = req.body;
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    return res.status(400).json({ error: 'contentType must be one of: ' + Object.keys(ALLOWED_TYPES).join(', ') });
  }

  const key = `avatars/${req.user.id}/${randomUUID()}.${ext}`;
  const uploadUrl = await getAvatarUploadUrl(key, contentType);
  res.json({ uploadUrl, key });
});

router.post('/confirm', async (req, res) => {
  const { key } = req.body;
  if (!key || !key.startsWith(`avatars/${req.user.id}/`)) {
    return res.status(400).json({ error: 'Invalid key' });
  }
  if (!(await objectExists(key))) {
    return res.status(400).json({ error: 'Upload not found — did the upload actually complete?' });
  }

  const avatarUrl = getPublicUrl(key);
  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.id);
  res.json({ id: req.user.id, email: req.user.email, avatarUrl });
});

export default router;
