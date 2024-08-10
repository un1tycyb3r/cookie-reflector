import type { Request, Response } from "caido:utils";

import { notNullable } from "./utils";

export type Finding = {
  request: Request;
  parameters: [string, string][];
  dedupeKey: string;
};

export function analyse(request: Request, response: Response): Finding | null {
  const query = request.getQuery();
  if (!query) {
    return null;
  }

  const parameters = Object.fromEntries(
    query
      .split("&")
      .map<[string, string] | null>((part) => {
        const i = part.indexOf("=");
        if (i === -1) {
          return null;
        }
        const key = part.slice(0, i);
        const value = part.slice(i + 1);
        return value ? [key, value] : null;
      })
      .filter(notNullable),
  );

  // Function to get cookies from the response headers
  function getCookies(cookieHeaders: string[]) { // Specify the type for cookieHeaders
    const cookies: Record<string, string> = {}; // Define cookies as a Record
    if (cookieHeaders) {
      cookieHeaders.forEach(header => {
        header.split(',').forEach(cookie => {
          const [name, value] = cookie.split(';')[0].split('=');
          if (name && value) {  // Ensure both name and value are present and non-empty
            cookies[name.trim()] = decodeURIComponent(value.trim());
          }
        });
      });
    }
    return cookies;
  }

  const setCookieHeaders = response.getHeader('Set-Cookie') || []; // Provide a default empty array
  const cookies = getCookies(setCookieHeaders);
  const reflectedParams = [];

  // Detect if the exact value of a query parameter is reflected in the cookies
  for (const [key, value] of Object.entries(parameters)) {
    for (const [cookieName, cookieValue] of Object.entries(cookies)) {
      if (cookieValue === value) {
        reflectedParams.push({
          key,
          value,
          cookieName,
          cookieValue
        });
      }
    }
  }

  if (reflectedParams.length > 0) {
    const dedupeKey = `${request.getMethod()}-${request.getHost()}-${request.getPath()}`;
    return {
      request,
      parameters: reflectedParams.map(param => [param.key, param.value]), // Map to the expected type
      dedupeKey,
    };
  }
  return null;
}