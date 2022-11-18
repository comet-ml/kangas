test::
	pytest -vvv backend/tests

clean::
	rm -fr *.datagrid backend/dist backend/build

build::
	cd frontend; yarn; yarn build
	rm -rf backend/kangas/frontend
	cp -rf frontend/.next backend/kangas/frontend
	rm -rf backend/kangas/frontend/cache/*

wheel::
	rm -rf backend/build/
	cd backend; python -m build --wheel

docs::
# git clone git@github.com:comet-ml/kangas.wiki.git wiki
	pydoc-markdown -m kangas > wiki/kangas.md
	pydoc-markdown -m kangas.datatypes.datagrid > wiki/DataGrid.md
	pydoc-markdown -m kangas.datatypes.image > wiki/Image.md
