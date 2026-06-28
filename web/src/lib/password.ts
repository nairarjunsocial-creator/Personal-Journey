import bcrypt from 'bcryptjs'

const ROUNDS = 10

export function hashDiaryPassword(plain: string): string {
  return bcrypt.hashSync(plain, ROUNDS)
}

export function verifyDiaryPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash)
}
