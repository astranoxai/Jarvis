import { ToolDefinition } from './types.js';

function decodeXml(text: string) {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function extractTag(
  block: string,
  tag: string
) {
  const match =
    block.match(
      new RegExp(
        `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
        'i'
      )
    );

  return match
    ? decodeXml(match[1])
    : '';
}

function cleanHeadline(
  title: string
) {
  return title
    .replace(/\s+-\s+[^-]+$/, '')
    .trim();
}

export const newsTool: ToolDefinition = {
  name: 'get_news',

  description:
    'Get recent news headlines from a live RSS news feed.',

  permission: 'read_only',

  parameters: {
    type: 'object',

    properties: {
      limit: {
        type: 'number',
        description:
          'Maximum number of headlines to return. Default 8, maximum 15.'
      }
    },

    required: [],
    additionalProperties: false
  },

  async execute(args) {
    try {
      const requestedLimit =
        Number(
          args.limit ?? 8
        );

      const limit =
        Math.max(
          1,
          Math.min(
            15,
            Number.isFinite(
              requestedLimit
            )
              ? Math.floor(
                  requestedLimit
                )
              : 8
          )
        );

      const feedUrl =
        process.env.NEWS_RSS_URL ||
        'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en';

      const response =
        await fetch(
          feedUrl,
          {
            headers: {
              'User-Agent':
                'NOVA Desktop Assistant'
            }
          }
        );

      if (!response.ok) {
        return {
          success: false,
          error:
            `News request failed with status ${response.status}`
        };
      }

      const xml =
        await response.text();

      const itemMatches =
        xml.match(
          /<item\b[\s\S]*?<\/item>/gi
        ) || [];

      const headlines =
        itemMatches
          .slice(
            0,
            limit
          )
          .map(
            (
              item,
              index
            ) => {
              const rawTitle =
                extractTag(
                  item,
                  'title'
                );

              const link =
                extractTag(
                  item,
                  'link'
                );

              const published =
                extractTag(
                  item,
                  'pubDate'
                );

              const sourceMatch =
                item.match(
                  /<source[^>]*>([\s\S]*?)<\/source>/i
                );

              const source =
                sourceMatch
                  ? decodeXml(
                      sourceMatch[1]
                    )
                  : '';

              return {
                id:
                  index + 1,

                title:
                  cleanHeadline(
                    rawTitle
                  ),

                source,

                published,

                link
              };
            }
          )
          .filter(
            (item) =>
              item.title
          );

      return {
        success: true,

        source:
          'Google News RSS',

        count:
          headlines.length,

        headlines,

        fetched_at:
          new Date()
            .toISOString()
      };

    } catch (error) {
      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }
};