# Rate is a property of an Account, not a Schedule

Investment returns and interest charges are modeled as an annual Rate on an Account, applied by the Projection engine each period as percentage-based compounding. They are not Schedules.

A Schedule requires a fixed source node, a fixed destination node, and a fixed amount. Returns don't have a fixed amount — they are proportional to the current balance, which changes every period. Forcing returns into the Schedule model would require a fake ExternalParty and a dynamically computed amount, which is awkward and misleading. Rate keeps Schedules as fixed-amount flows between nodes and gives the Projection engine a clean separate mechanism for balance-driven growth or decay.
