# BMT University Course Data

This directory contains all course content for BMT University, organized for portability and version control.

## Folder Structure

```
data/
├── courses.json           # All course data (lessons, quizzes, questions)
├── asset-manifest.json    # Maps every file to its course/lesson
├── README.md
│
├── thumbnails/            # COURSE THUMBNAILS (numbered in course order)
│   ├── 01_bitcoin_vs_kaspa.png
│   ├── 02_dag_terminology.png
│   ├── 03_dag_and_kaspa.png
│   ├── 04_bridging_l1_to_l2.png
│   ├── 05_self_custody.png
│   ├── 06_sound_money.png
│   ├── 07_foundational_concepts.png
│   ├── 08_core_data_structures.png
│   ├── 09_ghostdag_mechanics.png
│   ├── 10_consensus_parameters.png
│   ├── 11_block_processing.png
│   ├── 12_difficulty_adjustment.png
│   ├── 13_transaction_processing.png
│   ├── 14_anticone_finalization.png
│   ├── 15_pruning_system.png
│   ├── 16_virtual_state.png
│   ├── 17_finality_security.png
│   ├── 18_timestamps_median.png
│   ├── 19_network_scaling.png
│   └── 20_mev_solutions.png
│
├── lesson-images/         # LESSON-SPECIFIC IMAGES (organized by course)
│   │
│   ├── dag-and-kaspa/     # Course #3: DAG and Kaspa
│   │   ├── dag_graph_undirected.png   → "What is a Graph" lesson
│   │   ├── dag_graph_directed.png     → "What is a Directed Graph" lesson
│   │   ├── dag_graph_acyclic.png      → "What is an Acyclic Graph" lesson
│   │   ├── dag_bitcoin_chain.png      → "Bitcoin's Linear Chain" lesson
│   │   ├── dag_kaspa_blockdag.png     → "Kaspa's BlockDAG" lesson
│   │   └── dag_blocks_learning_meme.png → General DAG learning image
│   │
│   └── bitcoin-vs-kaspa/  # Course #1: Bitcoin vs Kaspa
│       └── bitcoin_vs_kaspa_speed_meme.png → Speed comparison lesson
│
└── videos/
    ├── lessons/           # LESSON VIDEOS (embedded in course content)
    │   ├── 9wXZuu-ZPXva7ncY_1765086712491.mp4
    │   └── vAOXqFGD2JBUhEC1_1765086579605.mp4
    │
    └── promo/             # PROMOTIONAL VIDEOS (marketing use)
        ├── bmt_university_crypto_promo_teaser.mp4
        ├── bmt_university_kaspa_branded_promo.mp4
        ├── bmt_university_title_card_reveal.mp4
        └── kaspa_blockdag_visuals_no_text.mp4
```

## Content Summary

| Type | Count |
|------|-------|
| Courses | 20 |
| Lessons | 88 |
| Quizzes | 20 |
| Quiz Questions | 158 |
| Course Thumbnails | 20 |
| Lesson Images | 7 |
| Lesson Videos | 2 local + 4 YouTube |
| Promo Videos | 4 |

## Course Thumbnails (Numbered in Order)

| # | Thumbnail | Course Title |
|---|-----------|--------------|
| 01 | 01_bitcoin_vs_kaspa.png | Bitcoin vs Kaspa: The Next Evolution |
| 02 | 02_dag_terminology.png | DAG Terminology |
| 03 | 03_dag_and_kaspa.png | DAG and Kaspa: Understanding the Structure |
| 04 | 04_bridging_l1_to_l2.png | Bridging Kaspa L1 to Kasplex L2 |
| 05 | 05_self_custody.png | Self-Custody & Hardware Wallets |
| 06 | 06_sound_money.png | Sound Money & Monetary Debasement |
| 07 | 07_foundational_concepts.png | Foundational Concepts |
| 08 | 08_core_data_structures.png | Core Data Structures |
| 09 | 09_ghostdag_mechanics.png | GHOSTDAG Mechanics |
| 10 | 10_consensus_parameters.png | Consensus Parameters |
| 11 | 11_block_processing.png | Block Processing |
| 12 | 12_difficulty_adjustment.png | Difficulty Adjustment (DAA) |
| 13 | 13_transaction_processing.png | Transaction Processing |
| 14 | 14_anticone_finalization.png | Anticone Finalization & Safe Pruning |
| 15 | 15_pruning_system.png | Pruning System |
| 16 | 16_virtual_state.png | Virtual State |
| 17 | 17_finality_security.png | Finality & Security |
| 18 | 18_timestamps_median.png | Timestamps & Median Time |
| 19 | 19_network_scaling.png | Network & Scaling |
| 20 | 20_mev_solutions.png | MEV and Kaspa's Solutions |

*Note: Courses 17 and 20 share the same image (security shield theme)*

## Lesson Images by Course

### Course #1: Bitcoin vs Kaspa
| Image | Lesson Topic |
|-------|--------------|
| bitcoin_vs_kaspa_speed_meme.png | Speed Comparison |

### Course #3: DAG and Kaspa
| Image | Lesson Topic |
|-------|--------------|
| dag_graph_undirected.png | What is a Graph |
| dag_graph_directed.png | What is a Directed Graph |
| dag_graph_acyclic.png | What is an Acyclic Graph |
| dag_bitcoin_chain.png | Bitcoin's Linear Chain |
| dag_kaspa_blockdag.png | Kaspa's BlockDAG |
| dag_blocks_learning_meme.png | General DAG Learning |

## Original Thumbnail Filenames

For reference, here are the original filenames:

| Numbered File | Original File |
|---------------|---------------|
| 01_bitcoin_vs_kaspa.png | bmt_jar_racing_meme.png |
| 02_dag_terminology.png | bmt_jar_professor_meme.png |
| 03_dag_and_kaspa.png | bmt_jar_holding_kaspa_coin.png |
| 04_bridging_l1_to_l2.png | bmt_jar_bridge_cyan_kaspa.png |
| 05_self_custody.png | bmt_jar_with_key_wallet.png |
| 06_sound_money.png | bmt_jar_gold_dollar_scale.png |
| 07_foundational_concepts.png | bmt_jar_teaching_dag_fundamentals.png |
| 08_core_data_structures.png | bmt_jar_with_data_structures.png |
| 09_ghostdag_mechanics.png | bmt_jar_ghostdag_ghost_theme.png |
| 10_consensus_parameters.png | bmt_jar_with_settings_gears.png |
| 11_block_processing.png | bmt_jar_block_processing_factory.png |
| 12_difficulty_adjustment.png | bmt_jar_balancing_difficulty.png |
| 13_transaction_processing.png | bmt_jar_processing_transactions.png |
| 14_anticone_finalization.png | bmt_jar_pruning_digital_garden.png |
| 15_pruning_system.png | bmt_jar_cleaning_pruning_system.png |
| 16_virtual_state.png | bmt_jar_virtual_reality_state.png |
| 17_finality_security.png | bmt_jar_security_shield_knight.png |
| 18_timestamps_median.png | bmt_jar_with_clock_timestamps.png |
| 19_network_scaling.png | bmt_jar_rocket_network_scaling.png |
| 20_mev_solutions.png | bmt_jar_security_shield_knight.png |

## Export Date
Last exported: January 30, 2026
