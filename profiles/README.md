# Profiles

This folder contains default profiles for the PromptKit system. Each profile defines a set of positive and negative prompts that are automatically applied when generating prompts.

## Profile Structure

Each profile is a JSON file with the following structure:

```json
{
  "id": "unique_id",
  "name": "Display Name",
  "description": "Description of what this profile is for",
  "positive": ["positive", "prompt", "terms"],
  "negative": ["negative", "prompt", "terms"]
}
```

## Available Profiles

- **default.json** - Basic prompt structure for general use
- **photorealistic.json** - For realistic image generation
- **artistic.json** - For artistic and creative images
- **anime.json** - For anime and manga style images
- **portrait.json** - For portrait photography and character close-ups

## Adding Custom Profiles

To add your own profile:

1. Create a new JSON file in this folder
2. Follow the profile structure above
3. Use a unique `id` for your profile
4. The profile will automatically be available in PromptKit

## Usage

Profiles are automatically loaded by the PromptKit system and can be selected when building prompts. The positive and negative terms from the selected profile are combined with your wildcard selections to create the final prompt.

