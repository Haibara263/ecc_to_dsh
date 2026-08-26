# Install the ECC pilot preset into the DSH user preset root.
# Run from the repo root (or pass -RepoRoot).
#   -IncludeAllSkills : also copy the full 285-skill catalog into the preset
#     (default: curated 14 only).
param(
  [string]$RepoRoot = (Split-Path -Parent $PSScriptRoot),
  [switch]$IncludeAllSkills
)

$presetSrc = Join-Path $RepoRoot '.dsh'
$presetRoot = Join-Path $env:USERPROFILE '.dsh\.agent-presets\ecc'
$skillsDst = Join-Path $presetRoot 'skills'
$agentsDst = Join-Path $presetRoot 'agents'
$commandsDst = Join-Path $presetRoot 'commands'

Write-Host "Installing ECC preset -> $presetRoot"
New-Item -ItemType Directory -Force -Path $skillsDst, $agentsDst, $commandsDst | Out-Null

Copy-Item (Join-Path $presetSrc 'preset\preset.yml')       (Join-Path $presetRoot 'preset.yml')       -Force
Copy-Item (Join-Path $presetSrc 'preset\agent.cordis.yml') (Join-Path $presetRoot 'agent.cordis.yml') -Force

# Pilot skills as flat Markdown (frontmatter name is the skill id).
Get-ChildItem (Join-Path $presetSrc 'skills') -Filter '*.md' | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $skillsDst $_.Name) -Force
}

# Optional: full 285-skill catalog (flat files + directory bundles).
if ($IncludeAllSkills) {
  $all = (Join-Path $presetSrc 'skills-full')
  Get-ChildItem $all | ForEach-Object {
    if ($_.PSIsContainer) {
      Copy-Item $_.FullName (Join-Path $skillsDst $_.Name) -Recurse -Force
    } elseif ($_.Name -like '*-SKILL.md') {
      Copy-Item $_.FullName (Join-Path $skillsDst $_.Name) -Force
    }
  }
  Write-Host 'Full 285-skill catalog copied into the preset.'
}

# Agent prompt assets + command registry travel with the preset.
Get-ChildItem (Join-Path $presetSrc 'agents') -Filter '*.md' | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $agentsDst $_.Name) -Force
}
Copy-Item (Join-Path $presetSrc 'commands\command-registry.md') (Join-Path $commandsDst 'command-registry.md') -Force

$nSkills = (Get-ChildItem $skillsDst -Filter '*.md').Count
$nAgents = (Get-ChildItem $agentsDst -Filter '*.md').Count
Write-Host "Installed: preset.yml, agent.cordis.yml, $nSkills skills, $nAgents agents, command-registry."
Write-Host "Start a new DSH session and pick preset 'ECC' to verify."
