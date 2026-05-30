# Merge Checklist: YYYY-NNN
**Job:** {title}
**Branch:** job/YYYY-NNN/{type}/{slug}
**Date:** YYYY-MM-DD
**Prepared by:** release-manager

---

## Pre-Merge Gates

### Quality Gates
- [ ] ✅ Lint: 0 errors
- [ ] ✅ TypeCheck: 0 errors
- [ ] ✅ Unit Tests: all pass
- [ ] ✅ Coverage ≥ 70% for changed files

### Review Gates
- [ ] review.yaml exists at `state/reviews/YYYY-NNN/review.yaml`
- [ ] review.status = `approved` or `approved_with_conditions`
- [ ] All `required_changes` addressed (ถ้า changes_requested loop)
- [ ] All `conditions_to_approve` met (ถ้า approved_with_conditions)

### Findings Gates
- [ ] critical_findings = 0 (หรือทุกตัว waived ด้วย reason)
- [ ] high_findings = 0 (หรือทุกตัว addressed/waived)

### CI Gates
- [ ] All GitHub Actions checks green
- [ ] No deployment blockers in CI

### Approval Gate
- [ ] Approval obtained (ถ้า tier = human_required)
- [ ] approval.yaml exists at `state/approvals/YYYY-NNN/approval.yaml`
- [ ] approval.action = `approved`

### Branch Gate
- [ ] Branch up-to-date กับ base branch (no unresolved conflicts)
- [ ] Commit history clean (no debug commits, no "wip" commits)

---

## Merge Steps

```bash
# Step 1: Final CI check
gh pr checks {pr_number}

# Step 2: Merge (squash)
gh pr merge {pr_number} --squash \
  --subject "{conventional commit message}"

# Step 3: Verify merge
git log main -1 --oneline

# Step 4: Delete branch
git push origin --delete job/YYYY-NNN/{type}/{slug}

# Step 5: Remove worktree
git worktree remove .worktrees/job-YYYY-NNN --force

# Step 6: Archive artifacts
mv state/jobs/YYYY-NNN state/jobs/archive/YYYY-NNN
```

---

## Post-Merge Verification

- [ ] Feature ทำงานได้ใน main (local verify)
- [ ] Deploy triggered (ถ้า auto-deploy)
- [ ] No new errors ใน monitoring (30 นาที)
- [ ] CHANGELOG updated (ถ้าต้องการ)
- [ ] Stakeholders notified

---

## Sign-off

Merged by: ___________
Date/Time: ___________
Commit Hash: ___________
