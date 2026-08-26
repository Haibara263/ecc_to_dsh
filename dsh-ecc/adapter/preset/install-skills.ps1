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

# Mounted-set seed: skills-active/ mirrors the curated set (the GUI 技能管理
# panel rewrites this directory on save).
$activeDst = Join-Path $presetRoot 'skills-active'
New-Item -ItemType Directory -Force -Path $activeDst | Out-Null
Get-ChildItem (Join-Path $presetSrc 'skills') -Filter '*.md' | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $activeDst $_.Name) -Force
}

# Full 285-skill catalog as the manager's source catalog (not mounted; the
# manager copies selected SKILL.md files from here into skills-active/).
Copy-Item (Join-Path $presetSrc 'skills-full') (Join-Path $presetRoot 'skills-full') -Recurse -Force

# Optional: additionally mount the full catalog directly.
if ($IncludeAllSkills) {
  $all = (Join-Path $presetSrc 'skills-full')
  Get-ChildItem $all | ForEach-Object {
    if ($_.PSIsContainer) {
      Copy-Item $_.FullName (Join-Path $skillsDst $_.Name) -Recurse -Force
    } elseif ($_.Name -like '*-SKILL.md') {
      Copy-Item $_.FullName (Join-Path $skillsDst $_.Name) -Force
    }
  }
  Write-Host 'Full 285-skill catalog also mounted into skills/ (use skills-active/ instead for the GUI-managed set).'
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
