"""QuantumEV simulation engine (Phase 5).

Responsibility: generate and continuously evolve the synthetic smart-city state
(100 EVs / 10 stations / 3 zones, battery levels, prices, solar, grid load) and
publish it to the frontend over WebSockets.

All values produced here are explicitly labelled as simulated data. Real charger
telemetry can later replace this source through an OCPP-compatible adapter that
implements the same snapshot interface.
"""

__version__ = "0.1.0"
