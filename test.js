import { onSuccess } from './src/index.js'

onSuccess({
  constants: { PUBLISH_DIR: './publish' },
  utils: { run: () => false },
})
