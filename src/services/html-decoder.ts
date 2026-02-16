import { decode } from 'he';

export function decodeHtmlEntities(text: string): string {
  return decode(text);
}
