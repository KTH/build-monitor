FROM kthse/kth-nodejs:9.11.0


RUN mkdir -p /npm && \
    mkdir -p /application

# We do this to avoid npm install when we're only changing code
WORKDIR /npm
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]
RUN npm ci --production

# Add the code and copy over the node_modules-catalog
WORKDIR /application
RUN cp -a /npm/node_modules /application && \
    rm -rf /npm

# Copy files
COPY ["package.json", "package.json"]
COPY ["app.js", "app.js"]
COPY ["server", "server"]
COPY ["public", "public"]

# Create the front-end code
COPY ["client", "client"]
COPY ["webpack.common.js", "webpack.common.js"]
COPY ["webpack.prod.js", "webpack.prod.js"]
RUN npm run build

EXPOSE 3000

CMD ["node", "app.js"]
