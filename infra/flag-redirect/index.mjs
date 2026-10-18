export default {
  fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    if (!/^\/[a-z]{2}\.svg$/.test(url.pathname)) {
      return new Response('Not found', { status: 404 });
    }
    const destination = new URL(`https://assets.avgeek.io/country-flags${url.pathname}`);
    destination.search = url.search;
    return Response.redirect(destination, 308);
  },
};
