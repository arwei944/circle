import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import en from '../messages/en';
import zh from '../messages/zh';

const catalogs = { en, zh };

export default getRequestConfig(async ({ requestLocale }) => {
   const requested = await requestLocale;
   const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
   return {
      locale,
      messages: catalogs[locale as keyof typeof catalogs],
   };
});
