"""add test user

Revision ID: 30a5eab8b4d2
Revises:
Create Date: 2026-01-13 18:56:49.208752

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '30a5eab8b4d2'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO users (id, email, hashed_password, name)
        VALUES (2, 'test@example.com', '$2b$12$JyZhDLdWr2p2dzjuTR31K.KCEJJ1JvH.c7ujH3UZtWe7UFTClV7sK', 'Test User');
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM users WHERE id = 2;
        """
    )
