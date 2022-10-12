test::
	pytest -vvv backend/tests

clean::
	rm -fr *.datagrid dist build

build::
	cd frontend; yarn; yarn build
	rm -rf backend/kangas/frontend
	cp -rf frontend/.next backend/kangas/frontend
	rm -rf backend/kangas/frontend/cache/*

wheel::
	cd backend; python -m build --wheel
