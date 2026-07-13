# Total In/Out classified by destination Account type, not just the ExternalParty boundary

finplan's Total In/Out figures (Schedules and Projection pages) don't follow a strict "internal transfers are neutral" rule. A Schedule counts as Total Out if its destination is an ExternalParty, but *also* if its destination Account is a loan or credit_card — even when the source is another tracked Account (e.g., a checking → credit-card payment). This reflects that paying down debt reads as an expense from the household's perspective, not a neutral internal shuffle.

We considered classifying purely by node type (ExternalParty vs. Account) and rejected it: that would leave debt payments uncounted as Out, which doesn't match how a household actually experiences them. This doesn't produce double-counting in practice, since card/loan purchases are not modeled as separate Schedules in this app — only the payments are.
