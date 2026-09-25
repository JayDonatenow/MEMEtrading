// X API v2 recent-search client. Requires X_BEARER_TOKEN (app-only auth) in env.
// Docs: https://developer.x.com/en/docs/x-api/tweets/search/api-reference/get-tweets-search-recent

export interface XTweet {
  id: string;
  text: string;
  authorUsername: string;
  authorName: string;
  authorProfileImageUrl?: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  url: string;
}

interface RawTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: { like_count: number; retweet_count: number };
}

interface RawUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

export function isXApiConfigured(): boolean {
  return Boolean(process.env.X_BEARER_TOKEN);
}

// Searches recent tweets mentioning a coin by symbol/name/contract address. Filters out
// obvious low-quality spam (no engagement, near-identical shill copy) is left to the caller —
// this just returns raw matches ranked by recency.
export async function searchCoinTweets(params: {
  symbol: string;
  name?: string;
  mintAddress?: string;
  maxResults?: number;
}): Promise<XTweet[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];

  const terms = [`$${params.symbol}`, params.mintAddress].filter(Boolean) as string[];
  const query = `(${terms.join(" OR ")}) -is:retweet lang:en`;

  const url = new URL("https://api.twitter.com/2/tweets/search/recent");
  url.searchParams.set("query", query);
  url.searchParams.set("max_results", String(params.maxResults ?? 10));
  url.searchParams.set("tweet.fields", "created_at,public_metrics,author_id");
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "username,name,profile_image_url");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    if (res.status === 429) return [];
    throw new Error(`X API request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { data?: RawTweet[]; includes?: { users?: RawUser[] } };
  const users = new Map((data.includes?.users ?? []).map((u) => [u.id, u]));

  return (data.data ?? []).map((t) => {
    const user = users.get(t.author_id);
    return {
      id: t.id,
      text: t.text,
      authorUsername: user?.username ?? "unknown",
      authorName: user?.name ?? "Unknown",
      authorProfileImageUrl: user?.profile_image_url,
      createdAt: t.created_at,
      likeCount: t.public_metrics?.like_count ?? 0,
      retweetCount: t.public_metrics?.retweet_count ?? 0,
      url: `https://x.com/${user?.username ?? "i"}/status/${t.id}`,
    };
  });
}
