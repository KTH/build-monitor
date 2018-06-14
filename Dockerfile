FROM node:8.9-wheezy

RUN mkdir -p /npm && \
    mkdir -p /application

# We do this to avoid npm install when we're only changing code
WORKDIR /npm
COPY ["package.json", "package.json"]
RUN npm install --production --no-optional

# Add the code and copy over the node_modules-catalog
WORKDIR /application
RUN cp -a /npm/node_modules /application && \
    rm -rf /npm

# Copy files
COPY ["package.json", "package.json"]
COPY ["app.js", "app.js"]

EXPOSE 3000

ENTRYPOINT ["node", "app.js"]