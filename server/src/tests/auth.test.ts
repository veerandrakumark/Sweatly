import { userRegistrationSchema } from 'shared';
import { passwordService } from '../services/passwordService.js';
import { tokenService } from '../services/tokenService.js';

describe('PasswordService Hashing & Validation Tests', () => {
  it('should hash a password and correctly verify it', async () => {
    const rawPass = 'P@ssword123!';
    const hash = await passwordService.hash(rawPass);

    expect(hash).not.toBe(rawPass);
    const isMatch = await passwordService.compare(rawPass, hash);
    expect(isMatch).toBe(true);

    const isDifferent = await passwordService.compare('WrongPass123!', hash);
    expect(isDifferent).toBe(false);
  });
});

describe('TokenService Cryptography Tests', () => {
  it('should hash tokens consistently using SHA-256', () => {
    const rawToken = 'my_secure_random_verification_key';
    const hash1 = tokenService.hashToken(rawToken);
    const hash2 = tokenService.hashToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 output is 64 hex characters
  });

  it('should generate secure random tokens', () => {
    const token = tokenService.generateRandomToken();
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(16);
  });
});

describe('Zod Register Payload Validation Tests', () => {
  const validRegisterPayload = {
    name: 'Sarah Athlete',
    email: 'sarah@example.com',
    password: 'P@ssword123!',
    preferredSports: ['soccer_id'],
    location: {
      coordinates: [-74.006, 40.7128], // valid NYC coords
    },
  };

  it('should parse valid registration inputs', () => {
    const parsed = userRegistrationSchema.safeParse(validRegisterPayload);
    expect(parsed.success).toBe(true);
  });

  it('should fail registration when password lacks uppercase', () => {
    const payload = { ...validRegisterPayload, password: 'password123!' };
    const parsed = userRegistrationSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('should fail registration when coordinates are out of bounds', () => {
    const payload = {
      ...validRegisterPayload,
      location: {
        coordinates: [200, 45], // longitude 200 is invalid
      },
    };
    const parsed = userRegistrationSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});
