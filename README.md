# docfx-template

A docfx template for package documentation, patching the modern template to provide stylesheets and scripts for rendering custom workflow containers with copy functionality.

## How to use

To include this template in a docfx website, first clone this repository as a submodule:

```
git submodule add https://github.com/bonsai-rx/docfx-template bonsai
```

Then modify `docfx.json` to include the template immediately after the modern template:

```json
    "template": [
      "default",
      "modern",
      "bonsai",
      "template"
    ],
```